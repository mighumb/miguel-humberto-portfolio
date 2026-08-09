import type { Application } from "@splinetool/runtime";

type SceneEntry = {
  loadPromise: Promise<Application>;
  app: Application | null;
  canvas: HTMLCanvasElement | null;
  rendered: boolean;
  attachedHost: HTMLElement | null;
  resizeObserver: ResizeObserver | null;
};

const sceneCache = new Map<string, SceneEntry>();
const bufferCache = new Map<string, Promise<ArrayBuffer>>();
let runtimePromise: Promise<typeof import("@splinetool/runtime")> | null = null;
let hiddenHost: HTMLDivElement | null = null;

const PRELOAD_WIDTH = 1280;
const PRELOAD_HEIGHT = 720;

function getRuntime() {
  runtimePromise ??= import("@splinetool/runtime");
  return runtimePromise;
}

function getHiddenHost(): HTMLDivElement {
  if (!hiddenHost && typeof document !== "undefined") {
    hiddenHost = document.createElement("div");
    hiddenHost.id = "spline-preload-host";
    hiddenHost.setAttribute("aria-hidden", "true");
    hiddenHost.style.cssText =
      "position:fixed;width:1280px;height:720px;opacity:0;pointer-events:none;overflow:hidden;left:-10000px;top:0;visibility:hidden";
    document.body.appendChild(hiddenHost);
  }
  return hiddenHost!;
}

function fetchSceneBuffer(sceneUrl: string): Promise<ArrayBuffer> {
  let promise = bufferCache.get(sceneUrl);
  if (!promise) {
    promise = fetch(sceneUrl)
      .then((response) => response.arrayBuffer())
      .catch(() => new ArrayBuffer(0));
    bufferCache.set(sceneUrl, promise);
  }
  return promise;
}

function getOrCreateEntry(sceneUrl: string): SceneEntry {
  let entry = sceneCache.get(sceneUrl);
  if (!entry) {
    entry = {
      loadPromise: createPreloadedApp(sceneUrl),
      app: null,
      canvas: null,
      rendered: false,
      attachedHost: null,
      resizeObserver: null,
    };
    sceneCache.set(sceneUrl, entry);
  }
  return entry;
}

function bindResize(entry: SceneEntry, host: HTMLElement, app: Application) {
  entry.resizeObserver?.disconnect();

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (width > 0 && height > 0) app.setSize(width, height);
  };

  resize();
  entry.resizeObserver = new ResizeObserver(resize);
  entry.resizeObserver.observe(host);
}

async function createPreloadedApp(sceneUrl: string): Promise<Application> {
  const [{ Application }, buffer] = await Promise.all([
    getRuntime(),
    fetchSceneBuffer(sceneUrl),
  ]);

  const canvas = document.createElement("canvas");
  canvas.className = "block h-full w-full touch-none";
  getHiddenHost().replaceChildren(canvas);

  const app = new Application(canvas, { renderMode: "continuous" });
  const entry = sceneCache.get(sceneUrl)!;
  entry.app = app;
  entry.canvas = canvas;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      entry.rendered = true;
      resolve();
    };

    app.addEventListener("rendered", finish);
    app.setSize(PRELOAD_WIDTH, PRELOAD_HEIGHT);

    if (buffer.byteLength > 0) {
      app.start(buffer, { interactive: true });
      return;
    }

    void app.load(sceneUrl).then(finish).catch(finish);
  });

  app.play();
  return app;
}

function reparentCanvas(entry: SceneEntry, host: HTMLElement) {
  const { app, canvas } = entry;
  if (!app || !canvas) return false;

  if (entry.attachedHost === host && host.contains(canvas)) {
    bindResize(entry, host, app);
    app.play();
    return entry.rendered;
  }

  entry.resizeObserver?.disconnect();
  entry.resizeObserver = null;
  host.replaceChildren(canvas);
  entry.attachedHost = host;
  bindResize(entry, host, app);
  app.play();
  app.requestRender?.();
  return entry.rendered;
}

/** Warm the runtime, scene bytes, and a hidden Application instance. */
export function preloadSplineScene(sceneUrl: string) {
  if (typeof window === "undefined") return;
  void getOrCreateEntry(sceneUrl).loadPromise;
}

export function isSplineSceneReady(sceneUrl: string) {
  return sceneCache.get(sceneUrl)?.rendered ?? false;
}

/** Move an already-loaded canvas into `host` synchronously when possible. */
export function attachSplineSceneIfReady(sceneUrl: string, host: HTMLElement) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry?.rendered || !entry.app || !entry.canvas) return false;
  return reparentCanvas(entry, host);
}

export function parkSplineScene(sceneUrl: string) {
  const entry = sceneCache.get(sceneUrl);
  if (!entry?.app || !entry.canvas) return;

  entry.resizeObserver?.disconnect();
  entry.resizeObserver = null;
  entry.attachedHost = null;
  getHiddenHost().replaceChildren(entry.canvas);
  entry.app.setSize(PRELOAD_WIDTH, PRELOAD_HEIGHT);
}

export async function attachSplineScene(sceneUrl: string, host: HTMLElement) {
  const entry = getOrCreateEntry(sceneUrl);
  await entry.loadPromise;
  const ready = reparentCanvas(entry, host);
  return {
    app: entry.app!,
    ready,
    detach: () => parkSplineScene(sceneUrl),
  };
}

export function waitForSplineScene(sceneUrl: string) {
  return getOrCreateEntry(sceneUrl).loadPromise;
}
