import { writeFileSync, mkdirSync } from "node:fs";

const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const LABEL = process.env.LABEL ?? "forced";

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
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 5000))`);

const rect = await evaluate(`(() => {
  const cards = [...document.querySelectorAll('.work-scroll .work-card-focus')];
  const cx = window.innerWidth / 2;
  const best = cards
    .map((el) => ({ el, r: el.querySelector('.work-card-visual').getBoundingClientRect() }))
    .filter(({ r }) => r.width > 80 && r.left > 0 && r.right < window.innerWidth)
    .sort((a, b) => Math.abs(a.r.left + a.r.width / 2 - cx) - Math.abs(b.r.left + b.r.width / 2 - cx))[0];
  if (!best) return null;
  window.__card = best.el;
  return best.r.toJSON();
})()`);
console.log("rect", rect);

const SCALE = Number(process.env.SCALE ?? 6);
const CLIP_W = Number(process.env.CLIP_W ?? 70);
const CLIP_H = Number(process.env.CLIP_H ?? 70);

async function shot(name) {
  const clip = {
    x: Math.max(0, Math.round(rect.left) - 6),
    y: Math.max(0, Math.round(rect.top) - 6),
    width: CLIP_W,
    height: CLIP_H,
    scale: SCALE,
  };
  const { data } = await send("Page.captureScreenshot", { format: "png", clip });
  writeFileSync(`/tmp/coverradius/${name}.png`, Buffer.from(data, "base64"));
  console.log("saved", name);
}

await shot(`${LABEL}-rest`);

// Headless Chrome reports hover:none / pointer:coarse, so the production hover
// rules never match here. Re-declare them unguarded to exercise the rendering.
await evaluate(`(() => {
  const style = document.createElement('style');
  style.id = 'forced-hover-fx';
  style.textContent = \`
    .force-hover .work-card-media { filter: url(#work-card-chromatic); }
    .force-glitch .work-card-media { animation: work-card-glitch-flash 160ms steps(2, jump-none); }
    .force-glitch .work-card-visual::after { animation: work-card-grain-flash 160ms ease-out; }
  \`;
  document.head.appendChild(style);
  window.__card.classList.add('force-hover');
  return true;
})()`);
await evaluate(`new Promise(r => setTimeout(r, 300))`);
console.log(
  "forced hover styles",
  JSON.stringify(
    await evaluate(`(() => {
      const media = window.__card.querySelector('.work-card-media');
      const visual = window.__card.querySelector('.work-card-visual');
      const g = (el) => { const s = getComputedStyle(el); return { radius: s.borderTopLeftRadius, overflow: s.overflow, ts: s.transformStyle, filter: s.filter }; };
      return { media: g(media), visual: g(visual) };
    })()`),
  ),
);
await shot(`${LABEL}-hover`);

await evaluate(`(() => { window.__card.classList.add('force-glitch'); return true; })()`);
await evaluate(`new Promise(r => setTimeout(r, 60))`);
await shot(`${LABEL}-glitch`);

socket.close();
