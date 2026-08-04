import { writeFileSync, mkdirSync } from "node:fs";

const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const LABEL = process.env.LABEL ?? "desktop";

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

mkdirSync("/tmp/coverradius", { recursive: true });
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

const pick = `(() => {
  const cards = [...document.querySelectorAll('.work-scroll .work-card-focus')];
  const cx = window.innerWidth / 2;
  const best = cards
    .map((el) => ({ el, r: el.querySelector('.work-card-visual').getBoundingClientRect() }))
    .filter(({ r }) => r.width > 80 && r.left > 0 && r.right < window.innerWidth)
    .sort((a, b) => Math.abs(a.r.left + a.r.width / 2 - cx) - Math.abs(b.r.left + b.r.width / 2 - cx))[0];
  if (!best) return null;
  window.__card = best.el;
  return best.r.toJSON();
})()`;

const rect = await evaluate(pick);
console.log(LABEL, "rect", rect);

async function shot(name) {
  const clip = {
    x: Math.max(0, Math.round(rect.left) - 6),
    y: Math.max(0, Math.round(rect.top) - 6),
    width: 70,
    height: 70,
    scale: 6,
  };
  const { data } = await send("Page.captureScreenshot", { format: "png", clip });
  writeFileSync(`/tmp/coverradius/${name}.png`, Buffer.from(data, "base64"));
  console.log("saved", name);
}

await shot(`${LABEL}-rest`);

const styles = await evaluate(`(() => {
  const visual = window.__card.querySelector('.work-card-visual');
  const media = window.__card.querySelector('.work-card-media');
  const g = (el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderTopLeftRadius, overflow: s.overflow, ts: s.transformStyle, filter: s.filter };
  };
  return { visual: g(visual), media: g(media) };
})()`);
console.log(LABEL, "rest styles", JSON.stringify(styles));

// Hover the card centre so the chromatic filter kicks in.
await send("Input.dispatchMouseEvent", {
  type: "mouseMoved",
  x: Math.round(rect.left + rect.width / 2),
  y: Math.round(rect.top + rect.height / 2),
  buttons: 0,
});
await evaluate(`new Promise(r => setTimeout(r, 600))`);

const hoverStyles = await evaluate(`(() => {
  const visual = window.__card.querySelector('.work-card-visual');
  const media = window.__card.querySelector('.work-card-media');
  const g = (el) => {
    const s = getComputedStyle(el);
    return { radius: s.borderTopLeftRadius, overflow: s.overflow, ts: s.transformStyle, filter: s.filter };
  };
  return { hovered: window.__card.matches(':hover'), visual: g(visual), media: g(media) };
})()`);
console.log(LABEL, "hover styles", JSON.stringify(hoverStyles));
await shot(`${LABEL}-hover`);

socket.close();
