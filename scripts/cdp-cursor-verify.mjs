const PORT = process.env.CDP_PORT ?? "9229";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";

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
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 6000))`);

console.log(
  "media:",
  await evaluate(
    `({ hover: matchMedia('(hover: hover)').matches, fine: matchMedia('(pointer: fine)').matches })`,
  ),
);

const geometry = await evaluate(`(() => {
  const cards = [...document.querySelectorAll('.work-scroll .work-card-focus')]
    .map((el) => ({
      inst: el.dataset.workInstance,
      body: el.querySelector('.work-card-body').getBoundingClientRect().toJSON(),
      visual: el.querySelector('.work-card-visual').getBoundingClientRect().toJSON(),
    }))
    .filter((c) => c.visual.width > 60 && c.visual.left > 0 && c.visual.right < window.innerWidth)
    .sort((a, b) => a.visual.left - b.visual.left);
  return cards;
})()`);

if (geometry.length < 2) {
  console.log("not enough fully visible cards", geometry.length);
  socket.close();
  process.exit(0);
}

const [first, second] = geometry;
const scrollRect = await evaluate(
  `document.querySelector('.work-scroll').getBoundingClientRect().toJSON()`,
);
console.log("scrollRect.top", Math.round(scrollRect.top), "first.body.top", Math.round(first.body.top));

const probes = [
  {
    name: "left of centre cover (inside container padding)",
    x: Math.max(scrollRect.left + 2, first.body.left - 14),
    y: first.visual.top + first.visual.height / 2,
    expect: "grab",
  },
  {
    name: "centre card cover",
    x: first.visual.left + first.visual.width / 2,
    y: first.visual.top + first.visual.height / 2,
    expect: "pointer",
  },
  {
    name: "band above centre card",
    x: first.visual.left + first.visual.width / 2,
    y: Math.max(scrollRect.top + 4, first.body.top - 12),
    expect: "grab",
  },
  {
    name: "receded card cover",
    x: second.visual.left + second.visual.width / 2,
    y: second.visual.top + second.visual.height / 2,
    expect: "pointer",
  },
  {
    name: "band above receded card",
    x: second.visual.left + second.visual.width / 2,
    y: Math.max(scrollRect.top + 4, second.body.top - 12),
    expect: "grab",
  },
  {
    name: "gap between covers",
    x: (first.visual.right + second.visual.left) / 2,
    y: Math.max(first.visual.top, second.visual.top) + 40,
    expect: "grab",
  },
  {
    name: "below centre card meta",
    x: first.visual.left + first.visual.width / 2,
    y: Math.min(scrollRect.bottom - 4, first.body.bottom + 16),
    expect: "grab",
  },
];

for (const probe of probes) {
  await send("Input.dispatchMouseEvent", {
    type: "mouseMoved",
    x: Math.round(probe.x),
    y: Math.round(probe.y),
    buttons: 0,
  });
  await evaluate(`new Promise(r => setTimeout(r, 350))`);
  const state = await evaluate(`(() => {
    const scroll = document.querySelector('.work-scroll');
    const el = document.elementFromPoint(${Math.round(probe.x)}, ${Math.round(probe.y)});
    const hovered = document.querySelector('.work-card-focus.is-hovered');
    return {
      cursor: el ? getComputedStyle(el).cursor : 'none',
      overCard: scroll.classList.contains('is-over-card'),
      hoveredInst: hovered ? hovered.dataset.workInstance : null,
      ctaOpacity: hovered ? getComputedStyle(hovered.querySelector('.work-card-cta')).opacity : null,
    };
  })()`);
  const ok = state.cursor === probe.expect;
  console.log(
    `${ok ? "OK  " : "FAIL"} ${probe.name}: cursor=${state.cursor} (expected ${probe.expect}) overCard=${state.overCard} hovered=${state.hoveredInst} ctaOpacity=${state.ctaOpacity}`,
  );
}

socket.close();
