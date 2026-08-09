import type { Application } from "@splinetool/runtime";

type SceneEntry = {
  loadPromise: Promise<Application>;
  app: Application | null;
  canvas: HTMLCanvasElement | null;
  rendered: boolean;
};

const sceneCache = new Map<string, SceneEntry>();
const bufferCache = new Map<string, Promise<ArrayBuffer>>();
let runtimePromise: Promise<typeof import("@splinetool/runtime")> | null = null;
let hiddenHost: HTMLDivElement | null = null;

const PRELOAD_WIDTH = 960;
const PRELOAD_HEIGHT = 540;

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
      "position:fixed;width:960px;height:540px;opacity:0;pointer-events:none;overflow:hidden;left:-10000px;top:0;visibility:hidden";
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
    };
    sceneCache.set(sceneUrl, entry);
  }
  return entry;
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

export async function attachSplineScene(sceneUrl: string, host: HTMLElement) {
  const entry = getOrCreateEntry(sceneUrl);
  const app = await entry.loadPromise;
  const canvas = entry.canvas;
  if (!canvas) throw new Error("Spline canvas missing after preload");

  host.replaceChildren(canvas);

  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (width > 0 && height > 0) app.setSize(width, height);
  };

  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  app.play();

  return {
    app,
    ready: entry.rendered,
    detach: () => {
      observer.disconnect();
      getHiddenHost().replaceChildren(canvas);
      app.setSize(PRELOAD_WIDTH, PRELOAD_HEIGHT);
    },
  };
}
