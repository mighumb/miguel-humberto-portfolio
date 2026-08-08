// Measures the Contact / brand navigation scroll: duration, easing shape, and
// whether the custom animation ran at all (native smooth is much shorter).
const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const WIDTH = Number(process.env.WIDTH ?? 1440);
const HEIGHT = Number(process.env.HEIGHT ?? 900);

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
  if (r.exceptionDetails) throw JSON.stringify(r.exceptionDetails).slice(0, 400);
  return r.result.value;
}

await send("Page.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 6000))`);

async function run(label, clickExpression) {
  const info = await evaluate(`(() => {
    window.__samples = [];
    window.__t0 = performance.now();
    window.__stop = false;
    const sample = () => {
      window.__samples.push({
        t: Math.round(performance.now() - window.__t0),
        y: Math.round(window.scrollY),
      });
      if (!window.__stop) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    return {
      from: Math.round(window.scrollY),
      maxScroll: Math.round(document.documentElement.scrollHeight - innerHeight),
      pointerFine: matchMedia('(hover: hover) and (pointer: fine)').matches,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  })()`);

  await evaluate(clickExpression);
  await evaluate(`new Promise(r => setTimeout(r, 3000))`);
  const samples = await evaluate(`(() => { window.__stop = true; return window.__samples; })()`);

  const moving = samples.filter((s, i) => i > 0 && s.y !== samples[i - 1].y);
  const start = moving.length ? moving[0].t : null;
  const end = moving.length ? moving[moving.length - 1].t : null;
  const from = samples[0].y;
  const to = samples[samples.length - 1].y;

  console.log(`\n=== ${label} ===`);
  console.log("context", info);
  console.log(`travel ${from} -> ${to} (${to - from}px)`);
  console.log(
    `motion duration: ${start === null ? "no movement" : `${end - start}ms`} (frames moving: ${moving.length})`,
  );
  const traj = [];
  let lastT = -100;
  for (const s of samples) {
    if (s.t - lastT >= 100) {
      traj.push(`${s.t}:${s.y}`);
      lastT = s.t;
    }
  }
  console.log("trajectory:", traj.join("  "));
}

await run(
  "Contact (hero nav)",
  `document.querySelector('nav a[href="#contact"]').click()`,
);

await run(
  "Brand back to top (sticky header)",
  `(() => {
    const links = [...document.querySelectorAll('nav a[href="#"]')];
    const link = links[links.length - 1];
    link.click();
    return true;
  })()`,
);

socket.close();
