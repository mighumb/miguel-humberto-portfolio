import { writeFileSync, mkdirSync } from "node:fs";

const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const LABEL = process.env.LABEL ?? "cursor";

const pages = await fetch(`http://localhost:${PORT}/json`).then((r) => r.json());
const page = pages.find((p) => p.type === "page") ?? pages[0];
const socket = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const m = JSON.parse(event.data);
  if (!m.id) return;
  pending.get(m.id)?.(m);
  pending.delete(m.id);
});
await new Promise((r) => socket.addEventListener("open", r, { once: true }));
function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const requestId = ++id;
    pending.set(requestId, (m) => (m.error ? reject(m.error) : resolve(m.result)));
    socket.send(JSON.stringify({ id: requestId, method, params }));
  });
}
async function evaluate(expression) {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw r.exceptionDetails;
  return r.result.value;
}

mkdirSync("/tmp/cursorprobe", { recursive: true });
await send("Page.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: false });
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 5000))`);

const report = await evaluate(`(() => {
  const cards = [...document.querySelectorAll('.work-scroll .work-card-focus')];
  const visible = cards
    .map((el) => ({
      el,
      article: el.getBoundingClientRect(),
      body: el.querySelector('.work-card-body').getBoundingClientRect(),
      visual: el.querySelector('.work-card-visual').getBoundingClientRect(),
      id: el.dataset.projectId,
    }))
    .filter((c) => c.visual.width > 60 && c.visual.left > 0 && c.visual.right < window.innerWidth)
    .sort((a, b) => a.visual.left - b.visual.left);

  const cursorAt = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return { x, y, el: null };
    return {
      x: Math.round(x),
      y: Math.round(y),
      tag: el.tagName.toLowerCase(),
      cls: (el.className || '').toString().split(' ').slice(0, 2).join(' '),
      cursor: getComputedStyle(el).cursor,
      inBody: !!el.closest('.work-card-body'),
    };
  };

  const probes = {};
  // Receded (non-centre) card: sample the empty band above its painted cover.
  const receded = visible.find((c) => c.visual.top > visible[0].visual.top + 8) ?? visible[1];
  if (receded) {
    probes.aboveRecededCover = cursorAt(
      receded.visual.left + receded.visual.width / 2,
      Math.max(2, receded.visual.top - 12),
    );
    probes.onRecededCover = cursorAt(
      receded.visual.left + receded.visual.width / 2,
      receded.visual.top + 20,
    );
  }
  // Visual gap between two painted covers.
  if (visible.length > 1) {
    const [a, b] = visible;
    probes.betweenCovers = cursorAt((a.visual.right + b.visual.left) / 2, a.visual.top + 40);
  }
  const centre = visible[0];
  probes.onCentreCover = cursorAt(
    centre.visual.left + centre.visual.width / 2,
    centre.visual.top + 40,
  );
  probes.aboveCentreCover = cursorAt(
    centre.visual.left + centre.visual.width / 2,
    Math.max(2, centre.visual.top - 12),
  );

  return {
    cards: visible.map((c) => ({
      id: c.id,
      article: { top: Math.round(c.article.top), left: Math.round(c.article.left), right: Math.round(c.article.right) },
      visual: { top: Math.round(c.visual.top), left: Math.round(c.visual.left), right: Math.round(c.visual.right) },
    })),
    probes,
  };
})()`);

console.log(LABEL, JSON.stringify(report, null, 2));

const shot = await send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
writeFileSync(`/tmp/cursorprobe/${LABEL}.jpg`, Buffer.from(shot.data, "base64"));
socket.close();
