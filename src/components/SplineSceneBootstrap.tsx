"use client";

import { useEffect } from "react";
import { preloadSplineScene } from "@/lib/splinePreload";

/** Keeps Spline hero scenes warm for the whole home session. */
export function SplineSceneBootstrap({ scenes }: { scenes: string[] }) {
  useEffect(() => {
    for (const scene of scenes) preloadSplineScene(scene);
  }, [scenes]);

  return null;
}
