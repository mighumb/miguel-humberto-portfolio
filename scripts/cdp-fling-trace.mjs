const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
// Negative xDistance scrolls content right (scrollLeft decreases).
const X_DISTANCE = Number(process.env.X_DISTANCE ?? -600);
const SPEED = Number(process.env.SPEED ?? 6000);

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

const geometry = await evaluate(`(() => {
  const c = document.querySelector('.work-scroll');
  const cards = [...c.querySelectorAll('[data-project-id]')];
  const loopSize = Number.parseInt(c.dataset.workLoopSize, 10);
  const copies = Number.parseInt(c.dataset.workLoopCopies, 10);
  const middle = Math.floor(copies / 2);
  const inset = Number.parseFloat(getComputedStyle(c).paddingLeft) || 0;
  const start = cards[loopSize * middle].offsetLeft - inset;
  const end = cards[loopSize * (middle + 1)].offsetLeft - inset;
  const cycleWidth = end - start;
  const maxScroll = c.scrollWidth - c.clientWidth;
  return {
    loopSize, copies, inset,
    start: Math.round(start), end: Math.round(end), cycleWidth: Math.round(cycleWidth),
    maxScroll: Math.round(maxScroll),
    clientWidth: c.clientWidth,
    scrollLeftNow: Math.round(c.scrollLeft),
    wrapSafeWindow: [Math.round(cycleWidth * 2), Math.round(maxScroll - cycleWidth * 2)],
  };
})()`);
console.log("geometry", geometry);

// Log every scroll sample plus every programmatic scrollLeft write.
await evaluate(`(() => {
  const c = document.querySelector('.work-scroll');
  window.__log = [];
  const t0 = performance.now();
  const proto = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft');
  Object.defineProperty(c, 'scrollLeft', {
    configurable: true,
    get() { return proto.get.call(this); },
    set(v) {
      const from = proto.get.call(this);
      window.__log.push({
        t: Math.round(performance.now() - t0),
        kind: 'write',
        from: Math.round(from),
        to: Math.round(v),
        delta: Math.round(v - from),
        via: (new Error().stack || '').split('\\n').slice(2, 5).map((s) => s.trim()).join(' | '),
      });
      return proto.set.call(this, v);
    },
  });
  const origScrollTo = c.scrollTo.bind(c);
  c.scrollTo = (...args) => {
    window.__log.push({ t: Math.round(performance.now() - t0), kind: 'scrollTo', args: JSON.stringify(args[0] ?? args) });
    return origScrollTo(...args);
  };
  c.addEventListener('scroll', () => {
    window.__log.push({ t: Math.round(performance.now() - t0), kind: 'scroll', at: Math.round(proto.get.call(c)) });
  }, { passive: true });
  return true;
})()`);

const target = await evaluate(`(() => {
  const r = document.querySelector('.work-scroll').getBoundingClientRect();
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.35) };
})()`);
console.log("gesture target", target);

await send("Input.synthesizeScrollGesture", {
  x: target.x,
  y: target.y,
  xDistance: X_DISTANCE,
  yDistance: 0,
  xOverscroll: 0,
  yOverscroll: 0,
  gestureSourceType: "touch",
  speed: SPEED,
  preventFling: false,
  repeatCount: 0,
});

await evaluate(`new Promise(r => setTimeout(r, 2500))`);

const log = await evaluate(`window.__log`);
const scrolls = log.filter((r) => r.kind === "scroll");
const writes = log.filter((r) => r.kind !== "scroll");
console.log("scroll samples:", scrolls.length);
console.log("first/last scroll:", scrolls[0], scrolls[scrolls.length - 1]);
console.log("programmatic writes during/after fling:", writes.length);
for (const w of writes.slice(0, 12)) console.log("  ", JSON.stringify(w));

// Show the scroll trajectory compressed: position every ~50ms.
const traj = [];
let lastT = -100;
for (const s of scrolls) {
  if (s.t - lastT >= 50) {
    traj.push(`${s.t}ms:${s.at}`);
    lastT = s.t;
  }
}
console.log("trajectory:", traj.join("  "));
socket.close();
