"use client";

import Spline from "@splinetool/react-spline/next";

export function HeroSplineOverlay({ scene }: { scene: string }) {
  return (
    <div className="absolute inset-0 z-10">
      <Spline scene={scene} className="h-full w-full" />
    </div>
  );
}
