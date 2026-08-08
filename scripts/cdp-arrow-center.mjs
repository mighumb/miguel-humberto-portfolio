// Measures the carousel nav arrows against the viewport centre and grabs a shot.
const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const WIDTH = Number(process.env.WIDTH ?? 390);
const HEIGHT = Number(process.env.HEIGHT ?? 844);
const OUT = process.env.OUT ?? "/tmp/arrows.png";

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

await send("Page.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: 2,
  mobile: WIDTH < 768,
});
if (WIDTH < 768) {
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
}
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 6000))`);

const measured = await evaluate(`(() => {
  const nav = document.querySelector('[aria-label="Carousel navigation"]');
  nav.scrollIntoView({ block: 'center' });
  return new Promise((resolve) => setTimeout(() => {
    const r = nav.getBoundingClientRect();
    const row = nav.parentElement.getBoundingClientRect();
    resolve({
      viewportWidth: innerWidth,
      viewportCentre: Math.round(innerWidth / 2),
      navLeft: Math.round(r.left),
      navRight: Math.round(r.right),
      navCentre: Math.round(r.left + r.width / 2),
      offsetFromCentre: Math.round(r.left + r.width / 2 - innerWidth / 2),
      rowLeft: Math.round(row.left),
      rowRight: Math.round(row.right),
    });
  }, 700));
})()`);
console.log(measured);

const shot = await send("Page.captureScreenshot", { format: "png" });
const { writeFile } = await import("node:fs/promises");
await writeFile(OUT, Buffer.from(shot.data, "base64"));
console.log("saved", OUT);
socket.close();
