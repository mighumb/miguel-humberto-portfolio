const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const DIRECTION = process.env.DIRECTION ?? "left";
const FLINGS = Number(process.env.FLINGS ?? 4);

const targets = await fetch(`http://localhost:${PORT}/json`).then((r) => r.json());
const page = targets.find((t) => t.type === "page") ?? targets[0];
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send("Page.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 6000))`);

const setup = await evaluate(`(() => {
  const c = document.querySelector('.work-scroll');
  const r = c.getBoundingClientRect();
  const cards = [...c.querySelectorAll('[data-project-id]')];
  const loopSize = Number.parseInt(c.dataset.workLoopSize, 10);
  const copies = Number.parseInt(c.dataset.workLoopCopies, 10);
  const inset = Number.parseFloat(getComputedStyle(c).paddingLeft) || 0;
  const middle = Math.floor(copies / 2);
  const start = cards[loopSize * middle].offsetLeft - inset;
  const cycleWidth = cards[loopSize * (middle + 1)].offsetLeft - inset - start;
  const maxScroll = c.scrollWidth - c.clientWidth;
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft');
  window.__log = [];
  window.__t0 = performance.now();
  Object.defineProperty(c, 'scrollLeft', {
    configurable: true,
    get() { return desc.get.call(this); },
    set(v) {
      const from = desc.get.call(this);
      if (Math.abs(v - from) > 0.5) {
        window.__log.push({ t: Math.round(performance.now() - window.__t0), kind: 'WRITE', from: Math.round(from), to: Math.round(v), jump: Math.round(v - from) });
      }
      return desc.set.call(this, v);
    },
  });
  c.addEventListener('scroll', () => {
    window.__log.push({ t: Math.round(performance.now() - window.__t0), kind: 'scroll', at: Math.round(desc.get.call(c)) });
  }, { passive: true });
  return {
    x: Math.round(r.left + r.width / 2),
    y: Math.round(r.top + r.height * 0.3),
    start: Math.round(start),
    cycleWidth: Math.round(cycleWidth),
    maxScroll: Math.round(maxScroll),
    safeWindow: [Math.round(cycleWidth * 2), Math.round(maxScroll - cycleWidth * 2)],
    cardStep: Math.round(cards[1].offsetLeft - cards[0].offsetLeft),
  };
})()`);
console.log("setup", setup, "direction", DIRECTION, "flings", FLINGS);

const sign = DIRECTION === "right" ? 1 : -1;
const startX = DIRECTION === "right" ? 60 : 330;
const y = setup.y;

for (let f = 0; f < FLINGS; f++) {
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y }] });
  for (let i = 1; i <= 10; i++) {
    await send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: startX + (sign * 270 * i) / 10, y }],
    });
    await sleep(4);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(260);
}

await sleep(2500);

const log = await evaluate(`window.__log`);
const scrolls = log.filter((r) => r.kind === "scroll");
const writes = log.filter((r) => r.kind === "WRITE");
console.log("scroll samples:", scrolls.length, "programmatic writes:", writes.length);
console.log("scrollLeft range:", Math.min(...scrolls.map((s) => s.at)), "→", Math.max(...scrolls.map((s) => s.at)));
for (const w of writes) {
  const nearFirstCard = Math.abs(w.from - setup.start) < setup.cardStep / 2;
  console.log(
    `WRITE t=${w.t}ms ${w.from} → ${w.to} (jump ${w.jump}) | distance from first-card position: ${w.from - setup.start}px${nearFirstCard ? "  << lands on first card" : ""}`,
  );
}
socket.close();
