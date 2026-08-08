const PORT = process.env.CDP_PORT ?? "9228";
const X = Number(process.env.X ?? 1086);
const Y = Number(process.env.Y ?? 447);

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

const out = await evaluate(`(() => {
  const stack = document.elementsFromPoint(${X}, ${Y}).slice(0, 8).map((el) => ({
    tag: el.tagName.toLowerCase(),
    cls: (el.className || '').toString().split(' ').slice(0, 3).join(' '),
    pid: el.dataset ? el.dataset.projectId : undefined,
    inst: el.dataset ? el.dataset.workInstance : undefined,
    cursor: getComputedStyle(el).cursor,
    z: getComputedStyle(el).zIndex,
  }));
  const hit = document.elementFromPoint(${X}, ${Y});
  const article = hit && hit.closest('.work-card-focus');
  const body = article && article.querySelector('.work-card-body');
  const visual = article && article.querySelector('.work-card-visual');
  return {
    stack,
    hitArticle: article ? { inst: article.dataset.workInstance, z: getComputedStyle(article).zIndex } : null,
    articleRect: article ? article.getBoundingClientRect().toJSON() : null,
    bodyRect: body ? body.getBoundingClientRect().toJSON() : null,
    visualRect: visual ? visual.getBoundingClientRect().toJSON() : null,
    bodyTransform: body ? getComputedStyle(body).transform : null,
    bodyPointerEvents: body ? getComputedStyle(body).pointerEvents : null,
    visualFilter: visual ? getComputedStyle(visual).filter : null,
  };
})()`);
console.log(JSON.stringify(out, null, 2));
socket.close();
