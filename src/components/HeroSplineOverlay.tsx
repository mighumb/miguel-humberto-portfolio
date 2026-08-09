"use client";

import { useEffect, useRef } from "react";
import type { Application } from "@splinetool/runtime";

export function HeroSplineOverlay({ scene }: { scene: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full touch-none";
    host.replaceChildren(canvas);

    import("@splinetool/runtime")
      .then(({ Application }) => {
        if (cancelled || !hostRef.current) return;
        const app = new Application(canvas);
        appRef.current = app;
        return app.load(scene);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      appRef.current?.dispose?.();
      appRef.current = null;
    };
  }, [scene]);

  return (
    <div
      ref={hostRef}
      className="hero-spline-overlay absolute inset-0 z-10 h-full w-full"
    />
  );
}
