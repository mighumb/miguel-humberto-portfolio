"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  attachSplineAnchor,
  attachSplineAnchorIfReady,
  ensureSplineCanvasMounted,
  isSplineSceneReady,
  preloadSplineScene,
  releaseSplineAnchor,
  syncSplineAnchor,
  updateSplineAnchorVisibility,
  waitForSplineScene,
} from "@/lib/splinePreload";

export function HeroSplineOverlay({
  scene,
  poster,
  visible = true,
  interactive = true,
}: {
  scene: string;
  poster?: string | null;
  visible?: boolean;
  interactive?: boolean;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(() => isSplineSceneReady(scene));
  const showSpline = visible && rendered;
  const showPoster = visible && Boolean(poster) && !rendered;
  const allowInteraction = interactive && showSpline;

  useLayoutEffect(() => {
    preloadSplineScene(scene);
    const anchor = anchorRef.current;
    const mount = mountRef.current;
    if (!anchor || !mount) return;

    let cancelled = false;
    const hidden = { interactive: false, shown: false };

    const attach = () => {
      if (cancelled || !anchorRef.current || !mountRef.current) return;
      ensureSplineCanvasMounted(scene, mountRef.current);
      if (attachSplineAnchorIfReady(scene, anchorRef.current, mountRef.current, hidden)) {
        setRendered(true);
      }
    };

    attach();

    if (!isSplineSceneReady(scene)) {
      waitForSplineScene(scene)
        .then(() => {
          if (cancelled || !anchorRef.current || !mountRef.current) return;
          ensureSplineCanvasMounted(scene, mountRef.current);
          return attachSplineAnchor(scene, anchorRef.current, mountRef.current, hidden);
        })
        .then((attached) => {
          if (!cancelled && attached?.ready) setRendered(true);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      releaseSplineAnchor(scene);
    };
  }, [scene]);

  useLayoutEffect(() => {
    ensureSplineCanvasMounted(scene, mountRef.current);
    updateSplineAnchorVisibility(scene, {
      interactive: allowInteraction,
      shown: showSpline,
    });
    syncSplineAnchor(scene);
  }, [scene, showSpline, allowInteraction]);

  useLayoutEffect(() => {
    ensureSplineCanvasMounted(scene, mountRef.current);
  });

  return (
    <>
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="hero-spline-poster pointer-events-none absolute inset-0 z-[15] h-full w-full object-cover"
          style={{
            opacity: showPoster ? 1 : 0,
            transition: showPoster ? "none" : "opacity 180ms ease-out",
          }}
          aria-hidden={!showPoster}
        />
      ) : null}
      <div
        ref={anchorRef}
        className="hero-spline-anchor pointer-events-none absolute inset-0 z-10"
        aria-hidden={!showSpline}
      >
        <div
          ref={mountRef}
          className="hero-spline-mount absolute inset-0 overflow-hidden touch-none"
        />
      </div>
    </>
  );
}
