const PORT = process.env.CDP_PORT ?? "9228";
const URL_TO_TEST = process.env.URL ?? "http://localhost:3100/?mode=ai";
const MOBILE = process.env.MOBILE !== "0";

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
await send(
  "Emulation.setDeviceMetricsOverride",
  MOBILE
    ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
    : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false },
);
await send(
  "Emulation.setTouchEmulationEnabled",
  MOBILE ? { enabled: true, maxTouchPoints: 5 } : { enabled: false },
);
await send("Page.navigate", { url: URL_TO_TEST });
await evaluate(`new Promise(r => setTimeout(r, 5000))`);

const out = await evaluate(`(() => {
  const themeBtn = [...document.querySelectorAll('nav button')].find((b) =>
    /mode/i.test(b.getAttribute('aria-label') || ''),
  );
  const arrows = [...document.querySelectorAll('[aria-label="Carousel navigation"] button')];
  const colourOf = (el) => (el ? getComputedStyle(el).color : null);
  return {
    viewport: { w: window.innerWidth, h: window.innerHeight },
    themeToggle: {
      label: themeBtn?.getAttribute('aria-label') ?? null,
      colour: colourOf(themeBtn),
      svgColour: colourOf(themeBtn?.querySelector('svg')),
    },
    arrows: arrows.map((b) => ({
      label: b.getAttribute('aria-label'),
      colour: colourOf(b),
      svgColour: colourOf(b.querySelector('svg')),
      disabled: b.disabled,
    })),
    tokens: {
      textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
      textSecondary: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim(),
    },
  };
})()`);

console.log(MOBILE ? "MOBILE" : "DESKTOP", JSON.stringify(out, null, 2));
const match =
  out.arrows.length > 0 && out.arrows.every((a) => a.svgColour === out.themeToggle.svgColour);
console.log(match ? "MATCH: arrows share the theme toggle colour" : "MISMATCH");
socket.close();
