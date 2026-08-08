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

  const target = cards[1] ?? cards[0];
  const v = target.v;
  const wantInst = target.el.dataset.workInstance;

  const map = [];
  for (let ry = 0.1; ry <= 0.9; ry += 0.2) {
    const row = [];
    for (let rx = 0.05; rx <= 0.95; rx += 0.1) {
      const x = Math.round(v.left + v.width * rx);
      const y = Math.round(v.top + v.height * ry);
      const el = document.elementFromPoint(x, y);
      const article = el && el.closest('.work-card-focus');
      const inBody = !!(el && el.closest('.work-card-body'));
      row.push(
        !el ? '-' : inBody && article?.dataset.workInstance === wantInst ? 'P'
        : inBody ? 'X'
        : article ? (article.dataset.workInstance === wantInst ? 'a' : 'A')
        : '.',
      );
    }
    map.push(row.join(''));
  }

  return {
    inst: wantInst,
    visualRect: { left: Math.round(v.left), top: Math.round(v.top), width: Math.round(v.width), height: Math.round(v.height) },
    bodyTransform: getComputedStyle(target.el.querySelector('.work-card-body')).transform,
    articleTransform: getComputedStyle(target.el).transform,
    legend: 'P=own card body, X=other card body, a=own article only, A=other article, .=chrome',
    map,
  };
})()`);

console.log(JSON.stringify(out, null, 2));
socket.close();
