"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  attachSplineAnchor,
  attachSplineAnchorIfReady,
  isSplineSceneReady,
  preloadSplineScene,
  releaseSplineAnchor,
  updateSplineAnchorVisibility,
  waitForSplineScene,
} from "@/lib/splinePreload";

export function HeroSplineOverlay({
  scene,
  poster,
  visible = true,
}: {
  scene: string;
  poster?: string | null;
  visible?: boolean;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(() => isSplineSceneReady(scene));
  const showSpline = visible && rendered;
  const showPoster = visible && Boolean(poster) && !rendered;

  useLayoutEffect(() => {
    preloadSplineScene(scene);
    const anchor = anchorRef.current;
    if (!anchor) return;

    let cancelled = false;
    const hidden = { interactive: false, shown: false };

    if (attachSplineAnchorIfReady(scene, anchor, hidden)) {
      setRendered(true);
    } else {
      waitForSplineScene(scene)
        .then(() => {
          if (cancelled || !anchorRef.current) return;
          attachSplineAnchor(scene, anchorRef.current, hidden).then(({ ready }) => {
            if (!cancelled && ready) setRendered(true);
          });
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
      releaseSplineAnchor(scene);
    };
  }, [scene]);

  useLayoutEffect(() => {
    updateSplineAnchorVisibility(scene, {
      interactive: showSpline,
      shown: showSpline,
    });
  }, [scene, showSpline]);

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
      />
    </>
  );
}
