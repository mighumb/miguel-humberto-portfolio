const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const DIRECTION = process.env.DIRECTION ?? "right"; // finger direction
const TRAVEL = Number(process.env.TRAVEL ?? 260);
const STEPS = Number(process.env.STEPS ?? 8);
const STEP_MS = Number(process.env.STEP_MS ?? 8);

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
  const desc = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollLeft');
  window.__log = [];
  window.__t0 = performance.now();
  Object.defineProperty(c, 'scrollLeft', {
    configurable: true,
    get() { return desc.get.call(this); },
    set(v) {
      const from = desc.get.call(this);
      if (Math.abs(v - from) > 0.5) {
        window.__log.push({
          t: Math.round(performance.now() - window.__t0),
          kind: 'WRITE',
          from: Math.round(from),
          to: Math.round(v),
          jump: Math.round(v - from),
          stack: (new Error().stack || '').split('\\n').slice(1, 6).map((s) => s.trim()),
        });
      }
      return desc.set.call(this, v);
    },
  });
  c.addEventListener('scroll', () => {
    window.__log.push({ t: Math.round(performance.now() - window.__t0), kind: 'scroll', at: Math.round(desc.get.call(c)) });
  }, { passive: true });
  return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height * 0.3), scrollLeft: Math.round(c.scrollLeft) };
})()`);
console.log("setup", setup, "direction", DIRECTION);

const sign = DIRECTION === "right" ? 1 : -1;
const startX = DIRECTION === "right" ? 60 : 330;
const y = setup.y;

await send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: startX, y }],
});
for (let i = 1; i <= STEPS; i++) {
  await send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: startX + sign * (TRAVEL * i) / STEPS, y }],
  });
  await sleep(STEP_MS);
}
await send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });

await sleep(2500);

const log = await evaluate(`window.__log`);
const scrolls = log.filter((r) => r.kind === "scroll");
const writes = log.filter((r) => r.kind === "WRITE");
console.log("scroll samples:", scrolls.length, "programmatic writes:", writes.length);
if (scrolls.length) {
  console.log("start", scrolls[0].at, "end", scrolls[scrolls.length - 1].at);
  const traj = [];
  let lastT = -60;
  for (const s of scrolls) {
    if (s.t - lastT >= 60) {
      traj.push(`${s.t}ms:${s.at}`);
      lastT = s.t;
    }
  }
  console.log("trajectory:", traj.join("  "));
  console.log("last scroll event at t =", scrolls[scrolls.length - 1].t, "ms");
}
for (const w of writes.slice(0, 10)) console.log("WRITE", JSON.stringify(w));
socket.close();
