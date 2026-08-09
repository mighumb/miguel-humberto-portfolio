"use client";

import { createElement, useEffect } from "react";

const SPLINE_VIEWER_SCRIPT =
  "https://unpkg.com/@splinetool/viewer@1.12.98/build/spline-viewer.js";

function ensureSplineViewerScript() {
  const scriptId = "spline-viewer-script";
  if (document.getElementById(scriptId)) return;
  const script = document.createElement("script");
  script.id = scriptId;
  script.type = "module";
  script.src = SPLINE_VIEWER_SCRIPT;
  document.head.appendChild(script);
}

export function HeroSplineOverlay({ scene }: { scene: string }) {
  useEffect(() => {
    ensureSplineViewerScript();
  }, []);

  return (
    <div className="absolute inset-0 z-10">
      {createElement("spline-viewer", {
        url: scene,
        style: { width: "100%", height: "100%" },
      })}
    </div>
  );
}
