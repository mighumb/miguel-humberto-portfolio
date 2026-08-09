import type { Application } from "@splinetool/runtime";

type AnchorOptions = {
  interactive: boolean;
  shown: boolean;
};

type SceneEntry = {
  loadPromise: Promise<Application>;
  app: Application | null;
  canvas: HTMLCanvasElement | null;
  rendered: boolean;
  floatHost: HTMLDivElement;
  anchor: HTMLElement | null;
  mount: HTMLElement | null;
  anchorOptions: AnchorOptions;
  resizeObserver: ResizeObserver | null;
  scrollCleanups: Array<() => void>;
  lastWidth: number;
  lastHeight: number;
};

const sceneCache = new Map<string, SceneEntry>();
const bufferCache = new Map<string, Promise<ArrayBuffer>>();
let runtimePromise: Promise<typeof import("@splinetool/runtime")> | null = null;

function getRuntime() {
  runtimePromise ??= import("@splinetool/runtime");
  return runtimePromise;
}

function getPreloadSize() {
  if (typeof window === "undefined") return { width: 1280, height: 720 };
  const width = Math.min(Math.max(Math.round(window.innerWidth), 320), 1280);
  const height = Math.round((width * 9) / 16);
  return { width, height };
}

function createFloatHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.className = "hero-spline-float-host";
  host.setAttribute("aria-hidden", "true");
  document.body.appendChild(host);
  return host;
}

function fetchSceneBuffer(sceneUrl: string): Promise<ArrayBuffer> {
  let promise = bufferCache.get(sceneUrl);
  if (!promise) {
    promise = fetch(sceneUrl, { priority: "high" } as RequestInit)
      .then((response) => response.arrayBuffer())
      .catch(() => new ArrayBuffer(0));
    bufferCache.set(sceneUrl, promise);
  }
  return promise;
}

function getOrCreateEntry(sceneUrl: string): SceneEntry {
  let entry = sceneCache.get(sceneUrl);
  if (!entry) {
    const floatHost = createFloatHost();
    entry = {
      loadPromise: createPreloadedApp(sceneUrl, floatHost),
      app: null,
      canvas: null,
      rendered: false,
      floatHost,
      anchor: null,
      mount: null,
      anchorOptions: { interactive: false, shown: false },
      resizeObserver: null,
      scrollCleanups: [],
      lastWidth: 0,
      lastHeight: 0,
    };
    sceneCache.set(sceneUrl, entry);
  }
  return entry;
}

function teardownAnchorListeners(entry: SceneEntry) {
  entry.resizeObserver?.disconnect();
  entry.resizeObserver = null;
  for (const cleanup of entry.scrollCleanups) cleanup();
  entry.scrollCleanups = [];
}

function applyMountVisibility(entry: SceneEntry) {
  const mount = entry.mount;
  if (!mount) return;

  const { interactive, shown } = entry.anchorOptions;
  Object.assign(mount.style, {
    opacity: shown ? "1" : "0",
    visibility: shown ? "visible" : "hidden",
    pointerEvents: shown && interactive ? "auto" : "none",
  });
}

function syncMountSize(entry: SceneEntry) {
  const { mount, app } = entry;
  if (!mount || !app) return;

  const { width, height } = mount.getBoundingClientRect();
  if (width < 1 || height < 1) return;

  const nextWidth = Math.round(width);
  const nextHeight = Math.round(height);
  if (nextWidth === entry.lastWidth && nextHeight === entry.lastHeight) return;

  entry.lastWidth = nextWidth;
  entry.lastHeight = nextHeight;
  app.setSize(nextWidth, nextHeight);
  app.requestRender?.();
}

function syncAnchor(entry: SceneEntry) {
  applyMountVisibility(entry);
  syncMountSize(entry);
}

function parkFloatHost(entry: SceneEntry) {
  const { app, floatHost, canvas } = entry;
  if (!app || !canvas) return;

  entry.anchor = null;
  entry.mount = null;
  teardownAnchorListeners(entry);
  entry.anchorOptions = { interactive: false, shown: false };

  const { width, height } = getPreloadSize();
  Object.assign(floatHost.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: `${width}px`,
    height: `${height}px`,
    opacity: "0",
    visibility: "hidden",
    pointerEvents: "none",
    zIndex: "-1",
    overflow: "hidden",
  });

  if (!floatHost.contains(canvas)) floatHost.replaceChildren(canvas);

  app.setSize(width, height);
  entry.lastWidth = width;
  entry.lastHeight = height;
}

function bindAnchor(
  entry: SceneEntry,
  anchor: HTMLElement,
  mount: HTMLElement,
  options: AnchorOptions,
) {
  entry.anchor = anchor;
  entry.mount = mount;
  entry.anchorOptions = options;
  teardownAnchorListeners(entry);

  const { canvas, app } = entry;
  if (!canvas || !app) return;

  if (!mount.contains(canvas)) mount.replaceChildren(canvas);

  const sync = () => syncAnchor(entry);
  sync();

  entry.resizeObserver = new ResizeObserver(sync);
  entry.resizeObserver.observe(mount);

  const scrollRoot = anchor.closest(".project-modal-scroll");
  if (scrollRoot) {
    scrollRoot.addEventListener("scroll", sync, { passive: true });
    entry.scrollCleanups.push(() => scrollRoot.removeEventListener("scroll", sync));
  }

  window.addEventListener("resize", sync, { passive: true });
  entry.scrollCleanups.push(() => window.removeEventListener("resize", sync));

  // Panel switch uses CSS animation, not transition — keep the mount sized
  // while the entering hero slides into place.
  let raf = 0;
  const end = performance.now() + 700;
  const tick = () => {
    sync();
    if (performance.now() < end) raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  entry.scrollCleanups.push(() => cancelAnimationFrame(raf));

  const onAnimationEnd = (event: AnimationEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (!target.classList.contains("project-modal-switch")) return;
    if (!target.contains(anchor)) return;
    sync();
  };
  document.addEventListener("animationend", onAnimationEnd);
  entry.scrollCleanups.push(() =>
    document.removeEventListener("animationend", onAnimationEnd),
  );

  app.play();
}

async function createPreloadedApp(
  sceneUrl: string,
  floatHost: HTMLDivElement,
): Promise<Application> {
  const [{ Application }, buffer] = await Promise.all([
    getRuntime(),
    fetchSceneBuffer(sceneUrl),
  ]);

  const { width, height } = getPreloadSize();
  const canvas = document.createElement("canvas");
  canvas.className = "block h-full w-full touch-none";
  floatHost.replaceChildren(canvas);

  const app = new Application(canvas, { renderMode: "continuous" });
  const entry = sceneCache.get(sceneUrl)!;
  entry.app = app;
  entry.canvas = canvas;
  entry.lastWidth = width;
  entry.lastHeight = height;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      entry.rendered = true;
      resolve();
    };

    app.addEventListener("rendered", finish);
    app.setSize(width, height);

    if (buffer.byteLength > 0) {
      app.start(buffer, { interactive: true });
      return;
    }

    void app.load(sceneUrl).then(finish).catch(finish);
  });

  app.play();
  parkFloatHost(entry);
  return app;
}

/** Warm the runtime, scene bytes, and a hidden Application instance. */
export function preloadSplineScene(sceneUrl: string) {
  if (typeof window === "undefined") return;
  void getOrCreateEntry(sceneUrl).loadPromise;
}

export function isSplineSceneReady(sceneUrl: string) {
  return sceneCache.get(sceneUrl)?.rendered ?? false;
}

export function ensureSplineCanvasMounted(sceneUrl: string, mount: HTMLElement | null) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry?.canvas || !mount) return false;
  if (!mount.contains(entry.canvas)) mount.replaceChildren(entry.canvas);
  entry.mount = mount;
  return true;
}

export function attachSplineAnchorIfReady(
  sceneUrl: string,
  anchor: HTMLElement,
  mount: HTMLElement,
  options: AnchorOptions,
) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry?.rendered || !entry.app || !entry.canvas) return false;
  bindAnchor(entry, anchor, mount, options);
  return true;
}

export function updateSplineAnchorVisibility(sceneUrl: string, options: AnchorOptions) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry?.mount) return;
  entry.anchorOptions = options;
  syncAnchor(entry);
}

export function syncSplineAnchor(sceneUrl: string) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry?.mount) return;
  syncAnchor(entry);
}

export function releaseSplineAnchor(sceneUrl: string) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry) return;
  parkFloatHost(entry);
}

export async function attachSplineAnchor(
  sceneUrl: string,
  anchor: HTMLElement,
  mount: HTMLElement,
  options: AnchorOptions,
) {
  const entry = getOrCreateEntry(sceneUrl);
  await entry.loadPromise;
  bindAnchor(entry, anchor, mount, options);
  return {
    app: entry.app!,
    ready: entry.rendered,
    detach: () => releaseSplineAnchor(sceneUrl),
  };
}

export function waitForSplineScene(sceneUrl: string) {
  return getOrCreateEntry(sceneUrl).loadPromise;
}
