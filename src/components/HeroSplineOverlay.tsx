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
  visible = true,
}: {
  scene: string;
  visible?: boolean;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(() => isSplineSceneReady(scene));
  const show = visible && rendered;

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
      interactive: show,
      shown: show,
    });
  }, [scene, show]);

  return (
    <div
      ref={anchorRef}
      className="hero-spline-anchor pointer-events-none absolute inset-0 z-10"
      aria-hidden={!show}
    />
  );
}
