"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

/**
 * Sparse particle overlay above page content (titles, cards),
 * below sticky header (z-100) and project modal (z-200).
 */
export default function AmbientForeground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (reducedMotion) return null;

  return (
    <div
      className="ambient-foreground pointer-events-none fixed inset-0 z-[40]"
      aria-hidden
      style={{ pointerEvents: "none" }}
    >
      <HeroScene variant="foreground" />
    </div>
  );
}
