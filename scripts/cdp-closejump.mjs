import { writeFileSync, mkdirSync } from "node:fs";

const PORT = process.env.CDP_PORT ?? "9228";
const pages = await fetch(`http://localhost:${PORT}/json`).then((r) => r.json());
const page =
  pages.find((p) => p.type === "page" && p.url.includes("localhost:3100")) ||
  pages.find((p) => p.type === "page");
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
async function shot(name) {
  const { data } = await send("Page.captureScreenshot", { format: "jpeg", quality: 60 });
  writeFileSync(`/tmp/closejump/${name}.jpg`, Buffer.from(data, "base64"));
}

mkdirSync("/tmp/closejump", { recursive: true });
await send("Page.enable");
await send("Network.enable");
await send("Network.setCacheDisabled", { cacheDisabled: true });
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://localhost:3100/?mode=ai" });
await evaluate(`new Promise(r => setTimeout(r, 4000))`);
const cssHref = await evaluate(`document.querySelector('link[rel=stylesheet]')?.href || ''`);
console.log("cssHref", cssHref);

// Scroll the home page so the card is not at the natural "top" alignment.
await evaluate(`window.scrollTo(0, 420)`);
await evaluate(`new Promise(r => setTimeout(r, 300))`);
const beforeOpen = await evaluate(`({
  pageY: Math.round(window.scrollY),
  carouselX: Math.round(document.querySelector('.work-scroll').scrollLeft),
})`);
console.log("beforeOpen", beforeOpen);

await evaluate(`(() => {
  const c = document.querySelector('.work-scroll');
  const cards = [...c.querySelectorAll('[data-project-id]')];
  const view = c.getBoundingClientRect();
  const target = cards.find(card => {
    const r = card.getBoundingClientRect();
    return r.left >= view.left - 4 && r.right <= view.right + 4;
  }) || cards.find(card => {
    const r = card.getBoundingClientRect();
    return r.left < view.right && r.right > view.left;
  });
  window.__opened = target.dataset.workInstance;
  target.click();
  return window.__opened;
})()`);
await evaluate(`new Promise(r => setTimeout(r, 1500))`);

// Scroll inside the modal like a user reading the project.
await evaluate(`(() => {
  const modal = document.querySelector('.project-modal-scroll') || document.querySelector('.project-modal');
  if (modal) modal.scrollTop = 900;
  return modal?.scrollTop ?? null;
})()`);
await evaluate(`new Promise(r => setTimeout(r, 400))`);
await shot("modal-scrolled");

// Instrument scroll writes during close.
await evaluate(`(() => {
  window.__scrollLog = [];
  const log = (why) => window.__scrollLog.push({
    t: Math.round(performance.now()),
    why,
    pageY: Math.round(window.scrollY),
    carouselX: Math.round(document.querySelector('.work-scroll')?.scrollLeft ?? -1),
    closing: document.documentElement.classList.contains('is-closing-flip'),
    prepare: document.documentElement.classList.contains('is-closing-prepare'),
    cardTop: (() => {
      const card = document.querySelector('[data-work-instance="' + window.__opened + '"]');
      return card ? Math.round(card.getBoundingClientRect().top) : null;
    })(),
  });
  const origTo = window.scrollTo.bind(window);
  window.scrollTo = (...args) => { const r = origTo(...args); log('window.scrollTo'); return r; };
  const origBy = window.scrollBy.bind(window);
  window.scrollBy = (...args) => { const r = origBy(...args); log('window.scrollBy'); return r; };
  window.__probe = setInterval(() => log('probe'), 16);
  log('before-close');
  return true;
})()`);

await evaluate(`(() => {
  const buttons = [...document.querySelectorAll('.project-modal button')];
  const closeBtn = buttons.find(b => /close|fermer/i.test(b.getAttribute('aria-label') || '')) || buttons.at(-1);
  closeBtn.click();
  return closeBtn?.getAttribute('aria-label');
})()`);

for (const ms of [0, 50, 100, 160, 240, 320, 480, 700]) {
  await evaluate(`new Promise(r => setTimeout(r, ${ms === 0 ? 0 : 50}))`);
  await shot(`close-${String(ms).padStart(3, "0")}`);
}

await evaluate(`new Promise(r => setTimeout(r, 400))`);
clearInterval;
const log = await evaluate(`(() => {
  clearInterval(window.__probe);
  return window.__scrollLog;
})()`);
console.log("scroll log:");
for (const row of log) console.log(row);

const deltas = [];
for (let i = 1; i < log.length; i++) {
  const a = log[i - 1], b = log[i];
  if (a.cardTop != null && b.cardTop != null && Math.abs(a.cardTop - b.cardTop) > 8) {
    deltas.push({ from: a, to: b, dTop: b.cardTop - a.cardTop, dPageY: b.pageY - a.pageY, dCarousel: b.carouselX - a.carouselX });
  }
}
console.log("cardTop jumps >8px:", deltas);

const carouselJumps = [];
for (let i = 1; i < log.length; i++) {
  const a = log[i - 1], b = log[i];
  if (Math.abs(b.carouselX - a.carouselX) > 8) {
    carouselJumps.push({ from: a, to: b, dCarousel: b.carouselX - a.carouselX });
  }
}
console.log("carouselX jumps >8px:", carouselJumps.length, carouselJumps.slice(0, 3));

const duringClose = log.filter((r) => r.closing || r.prepare);
const carouselDuringClose = duringClose.map((r) => r.carouselX);
const carouselOk = carouselDuringClose.every((x) => Math.abs(x - beforeOpen.carouselX) <= 2 || x === beforeOpen.carouselX);
console.log("carousel stable during close vs beforeOpen:", carouselOk, { before: beforeOpen.carouselX, samples: [...new Set(carouselDuringClose)].slice(0, 5) });

socket.close();
