"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

/* Night space: deep near-black blue, soft and low so particles stay readable */
const SPACE_SKY = `
  radial-gradient(ellipse 90% 55% at 50% 0%, rgba(14, 18, 32, 0.4), transparent 55%),
  radial-gradient(ellipse 50% 35% at 85% 80%, rgba(8, 10, 18, 0.35), transparent 50%)
`;

/* Snowy sky: light gray + white only — stay close to main #f5f5f7 so flakes read */
const SNOW_SKY = `
  radial-gradient(ellipse 100% 60% at 50% -5%, rgba(255, 255, 255, 0.85), transparent 55%),
  radial-gradient(ellipse 55% 40% at 20% 35%, rgba(255, 255, 255, 0.4), transparent 60%),
  radial-gradient(ellipse 50% 35% at 80% 30%, rgba(255, 255, 255, 0.35), transparent 55%),
  linear-gradient(
    180deg,
    #e8e8eb 0%,
    #efeff1 35%,
    #f4f4f6 65%,
    #f7f7f8 100%
  )
`;

export default function AmbientBackground() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <div className="ambient-background pointer-events-none fixed inset-0 z-0 min-h-dvh" aria-hidden>
      <div
        className="absolute inset-0 transition-[opacity,background] duration-500"
        style={{ background: isDark ? SPACE_SKY : SNOW_SKY }}
      />

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
