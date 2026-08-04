import { writeFileSync, mkdirSync } from "node:fs";

const PORT = process.env.CDP_PORT ?? "9228";
const LABEL = process.env.LABEL ?? "head";
const MOBILE = process.env.MOBILE === "1";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";

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
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (r.exceptionDetails) throw r.exceptionDetails;
  return r.result.value;
}

mkdirSync("/tmp/coverradius", { recursive: true });
await send("Page.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send(
  "Emulation.setDeviceMetricsOverride",
  MOBILE
    ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
);
await send("Emulation.setTouchEmulationEnabled", {
  enabled: MOBILE,
  maxTouchPoints: MOBILE ? 5 : 0,
});
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 5000))`);

const probe = `(() => {
  const cards = [...document.querySelectorAll('.work-scroll .work-card-focus')];
  const cx = window.innerWidth / 2;
  const card = cards
    .map((el) => ({ el, r: el.querySelector('.work-card-visual').getBoundingClientRect() }))
    .filter(({ r }) => r.width > 40 && r.right > 0 && r.left < window.innerWidth)
    .sort((a, b) => Math.abs(a.r.left + a.r.width / 2 - cx) - Math.abs(b.r.left + b.r.width / 2 - cx))[0];
  if (!card) return { error: 'no visible card', count: cards.length };
  const visual = card.el.querySelector('.work-card-visual');
  const media = card.el.querySelector('.work-card-media');
  const img = media.querySelector('img');
  const cs = (el) => {
    const s = getComputedStyle(el);
    return {
      radius: s.borderTopLeftRadius,
      overflow: s.overflow,
      transformStyle: s.transformStyle,
      filter: s.filter,
      inlineTransformStyle: el.style.transformStyle || '(none)',
      inlineFilter: el.style.filter || '(none)',
    };
  };
  return {
    cssRules: (() => { try { return document.styleSheets[0].cssRules.length; } catch { return -1; } })(),
    projectId: card.el.dataset.projectId,
    visual: cs(visual),
    media: cs(media),
    img: img ? cs(img) : null,
    rect: visual.getBoundingClientRect().toJSON(),
  };
})()`;

const info = await evaluate(probe);
console.log(LABEL, JSON.stringify(info, null, 2));

if (info.rect) {
  const clip = {
    x: Math.max(0, Math.round(info.rect.left) - 6),
    y: Math.max(0, Math.round(info.rect.top) - 6),
    width: 64,
    height: 64,
    scale: 6,
  };
  const { data } = await send("Page.captureScreenshot", { format: "png", clip });
  writeFileSync(`/tmp/coverradius/${LABEL}-corner.png`, Buffer.from(data, "base64"));
  console.log("saved", `/tmp/coverradius/${LABEL}-corner.png`);
}

socket.close();
