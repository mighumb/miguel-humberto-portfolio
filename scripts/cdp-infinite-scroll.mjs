// Chained-fling probe: verifies the Work carousel never runs out of cards.
// Per animation frame it records scrollLeft plus the blank space visible on
// either side of the card strip, and flags any frame clamped at a real DOM edge.
const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const DIRECTION = process.env.DIRECTION ?? "right";
const FLINGS = Number(process.env.FLINGS ?? 12);
const PAUSE_MS = Number(process.env.PAUSE_MS ?? 200);
const TRAVEL = Number(process.env.TRAVEL ?? 300);

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
  const r = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
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
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft');
  window.__writes = [];
  window.__frames = [];
  window.__t0 = performance.now();
  Object.defineProperty(c, 'scrollLeft', {
    configurable: true,
    get() { return desc.get.call(this); },
    set(v) {
      const from = desc.get.call(this);
      if (Math.abs(v - from) > 0.5) {
        window.__writes.push({
          t: Math.round(performance.now() - window.__t0),
          from: Math.round(from),
          to: Math.round(v),
          jump: Math.round(v - from),
        });
      }
      return desc.set.call(this, v);
    },
  });

  // Blank space = viewport area to the left of the first painted card or to the
  // right of the last one. A truly infinite strip never shows either.
  const sample = () => {
    const box = c.getBoundingClientRect();
    let left = Infinity;
    let right = -Infinity;
    for (const card of cards) {
      const cr = card.getBoundingClientRect();
      if (cr.right < box.left - 200 || cr.left > box.right + 200) continue;
      left = Math.min(left, cr.left);
      right = Math.max(right, cr.right);
    }
    const at = desc.get.call(c);
    window.__frames.push({
      t: Math.round(performance.now() - window.__t0),
      at: Math.round(at),
      blankLeft: Number.isFinite(left) ? Math.round(Math.max(0, left - box.left)) : 9999,
      blankRight: Number.isFinite(right) ? Math.round(Math.max(0, box.right - right)) : 9999,
      atMin: at <= 0.5,
      atMax: at >= c.scrollWidth - c.clientWidth - 0.5,
    });
    window.__raf = requestAnimationFrame(sample);
  };
  window.__raf = requestAnimationFrame(sample);

  return {
    x: Math.round(r.left + r.width / 2),
    y: Math.round(r.top + r.height * 0.3),
    start: Math.round(start),
    cycleWidth: Math.round(cycleWidth),
    maxScroll: Math.round(c.scrollWidth - c.clientWidth),
    cards: cards.length,
  };
})()`);
console.log("setup", setup, "| direction", DIRECTION, "flings", FLINGS, "pause", PAUSE_MS);

const sign = DIRECTION === "right" ? 1 : -1;
const startX = DIRECTION === "right" ? 60 : 330;
const y = setup.y;

for (let f = 0; f < FLINGS; f++) {
  await send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: startX, y }] });
  for (let i = 1; i <= 10; i++) {
    await send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [{ x: startX + (sign * TRAVEL * i) / 10, y }],
    });
    await sleep(4);
  }
  await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(PAUSE_MS);
}

await sleep(2500);
await evaluate(`cancelAnimationFrame(window.__raf)`);

const frames = await evaluate(`window.__frames`);
const writes = await evaluate(`window.__writes`);
const positions = frames.map((f) => f.at);
const blank = frames.filter((f) => f.blankLeft > 1 || f.blankRight > 1);
const clamped = frames.filter((f) => f.atMin || f.atMax);

console.log("frames sampled:", frames.length, "| programmatic writes:", writes.length);
console.log("scrollLeft range:", Math.min(...positions), "→", Math.max(...positions));
console.log(
  "distance travelled (sum of |delta| between frames):",
  Math.round(
    positions.reduce((sum, at, i) => (i ? sum + Math.abs(at - positions[i - 1]) : 0), 0),
  ),
);
console.log("frames with blank space:", blank.length);
for (const f of blank.slice(0, 5)) console.log("  BLANK", JSON.stringify(f));
console.log("frames clamped at a DOM edge:", clamped.length);
for (const f of clamped.slice(0, 5)) console.log("  EDGE", JSON.stringify(f));
console.log("writes:");
for (const w of writes.slice(0, 20)) {
  console.log(`  t=${w.t}ms ${w.from} → ${w.to} (jump ${w.jump}, cycles ${(w.jump / setup.cycleWidth).toFixed(2)})`);
}
socket.close();
