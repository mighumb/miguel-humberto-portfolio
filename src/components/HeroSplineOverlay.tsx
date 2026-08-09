"use client";

import { useEffect, useRef, useState } from "react";
import type { Application } from "@splinetool/runtime";
import {
  attachSplineScene,
  isSplineSceneReady,
  preloadSplineScene,
} from "@/lib/splinePreload";

export function HeroSplineOverlay({
  scene,
  visible = true,
}: {
  scene: string;
  visible?: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const [rendered, setRendered] = useState(() => isSplineSceneReady(scene));

  useEffect(() => {
    preloadSplineScene(scene);
  }, [scene]);

  useEffect(() => {
    let cancelled = false;
    let detach: (() => void) | undefined;
    const host = hostRef.current;
    if (!host) return;

    if (!isSplineSceneReady(scene)) setRendered(false);

    attachSplineScene(scene, host)
      .then(({ app, ready, detach: release }) => {
        if (cancelled) {
          release();
          return;
        }
        detach = release;
        appRef.current = app;
        if (ready) {
          setRendered(true);
          return;
        }

        const onRendered = () => {
          if (!cancelled) setRendered(true);
        };
        app.addEventListener("rendered", onRendered);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      detach?.();
      appRef.current = null;
    };
  }, [scene]);

  const show = visible && rendered;
  const fadeMs = isSplineSceneReady(scene) ? 0 : 500;

  return (
    <div
      ref={hostRef}
      className="hero-spline-overlay absolute inset-0 z-10 h-full w-full"
      style={{
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
        transition: fadeMs ? `opacity ${fadeMs}ms ease-out` : undefined,
      }}
      aria-hidden={!show}
    />
  );
}
