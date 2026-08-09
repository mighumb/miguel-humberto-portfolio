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

function syncAnchor(entry: SceneEntry) {
  const { anchor, app, floatHost } = entry;
  if (!anchor || !app) return;

  const rect = anchor.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;

  const { interactive, shown } = entry.anchorOptions;
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);

  Object.assign(floatHost.style, {
    position: "fixed",
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    opacity: shown ? "1" : "0",
    visibility: shown ? "visible" : "hidden",
    pointerEvents: shown && interactive ? "auto" : "none",
    zIndex: shown ? "210" : "-1",
    overflow: "hidden",
  });

  if (width !== entry.lastWidth || height !== entry.lastHeight) {
    entry.lastWidth = width;
    entry.lastHeight = height;
    app.setSize(width, height);
    app.requestRender?.();
  }
}

function parkFloatHost(entry: SceneEntry) {
  const { app, floatHost, canvas } = entry;
  if (!app || !canvas) return;

  entry.anchor = null;
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

function bindAnchor(entry: SceneEntry, anchor: HTMLElement, options: AnchorOptions) {
  entry.anchor = anchor;
  entry.anchorOptions = options;
  teardownAnchorListeners(entry);

  const sync = () => syncAnchor(entry);
  sync();

  entry.resizeObserver = new ResizeObserver(sync);
  entry.resizeObserver.observe(anchor);

  const scrollRoot = anchor.closest(".project-modal-scroll");
  if (scrollRoot) {
    scrollRoot.addEventListener("scroll", sync, { passive: true });
    entry.scrollCleanups.push(() => scrollRoot.removeEventListener("scroll", sync));
  }

  window.addEventListener("scroll", sync, { passive: true });
  entry.scrollCleanups.push(() => window.removeEventListener("scroll", sync));

  window.addEventListener("resize", sync, { passive: true });
  entry.scrollCleanups.push(() => window.removeEventListener("resize", sync));
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

export function attachSplineAnchorIfReady(
  sceneUrl: string,
  anchor: HTMLElement,
  options: AnchorOptions,
) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry?.rendered || !entry.app || !entry.canvas) return false;
  bindAnchor(entry, anchor, options);
  entry.app.play();
  return true;
}

export function updateSplineAnchorVisibility(sceneUrl: string, options: AnchorOptions) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry?.anchor) return;
  entry.anchorOptions = options;
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
  options: AnchorOptions,
) {
  const entry = getOrCreateEntry(sceneUrl);
  await entry.loadPromise;
  bindAnchor(entry, anchor, options);
  entry.app!.play();
  return {
    app: entry.app!,
    ready: entry.rendered,
    detach: () => releaseSplineAnchor(sceneUrl),
  };
}

export function waitForSplineScene(sceneUrl: string) {
  return getOrCreateEntry(sceneUrl).loadPromise;
}
