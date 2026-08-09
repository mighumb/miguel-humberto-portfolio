"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { Application } from "@splinetool/runtime";
import {
  attachSplineScene,
  attachSplineSceneIfReady,
  isSplineSceneReady,
  parkSplineScene,
  preloadSplineScene,
  waitForSplineScene,
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

  useLayoutEffect(() => {
    preloadSplineScene(scene);
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;

    if (attachSplineSceneIfReady(scene, host)) {
      setRendered(true);
      return () => parkSplineScene(scene);
    }

    waitForSplineScene(scene)
      .then((app) => {
        if (cancelled || !hostRef.current) return;
        appRef.current = app;
        return attachSplineScene(scene, hostRef.current);
      })
      .then((attached) => {
        if (!cancelled && attached?.ready) setRendered(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      appRef.current = null;
      parkSplineScene(scene);
    };
  }, [scene]);

  const show = visible && rendered;

  return (
    <div
      ref={hostRef}
      className="hero-spline-overlay absolute inset-0 z-10 h-full w-full"
      style={{
        opacity: show ? 1 : 0,
        pointerEvents: show ? "auto" : "none",
      }}
      aria-hidden={!show}
    />
  );
}
