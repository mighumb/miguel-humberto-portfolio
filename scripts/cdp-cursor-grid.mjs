const PORT = process.env.CDP_PORT ?? "9228";
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
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw r.exceptionDetails;
  return r.result.value;
}

await send("Page.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: false });
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 6000))`);

const out = await evaluate(`(() => {
  const cards = [...document.querySelectorAll('.work-scroll .work-card-focus')]
    .map((el) => ({ el, v: el.querySelector('.work-card-visual').getBoundingClientRect() }))
    .filter((c) => c.v.width > 60 && c.v.left > 0 && c.v.right < window.innerWidth)
    .sort((a, b) => a.v.left - b.v.left);

  const at = (x, y) => {
    const el = document.elementFromPoint(x, y);
    if (!el) return 'none';
    return getComputedStyle(el).cursor + (el.closest('.work-card-body') ? '(card)' : '(chrome)');
  };

  const rows = cards.map(({ el, v }) => ({
    inst: el.dataset.workInstance,
    coverCentre: at(v.left + v.width / 2, v.top + v.height / 2),
    coverUpperLeftInset: at(v.left + 12, v.top + v.height * 0.35),
    coverUpperRightInset: at(v.right - 12, v.top + v.height * 0.35),
    aboveCoverBand: at(v.left + v.width / 2, Math.max(2, v.top - 14)),
  }));

  const gaps = [];
  for (let i = 1; i < cards.length; i++) {
    const a = cards[i - 1].v;
    const b = cards[i].v;
    const midX = (a.right + b.left) / 2;
    if (b.left - a.right < 4) continue;
    gaps.push({
      midX: Math.round(midX),
      atCoverHeight: at(midX, Math.max(a.top, b.top) + 40),
      atLowerHeight: at(midX, Math.min(a.bottom, b.bottom) - 20),
    });
  }

  return { rows, gaps };
})()`);

console.log(JSON.stringify(out, null, 2));
socket.close();
