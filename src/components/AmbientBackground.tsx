"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

export default function AmbientBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="ambient-background pointer-events-none fixed inset-0 z-0" aria-hidden>
      {!reducedMotion && <HeroScene />}

      {reducedMotion && (
        <div className="flex h-full items-center justify-center">
          <div
            className="h-64 w-64 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, var(--hero-particle) 0%, transparent 70%)",
            }}
          />
        </div>
      )}
    </div>
  );
}
