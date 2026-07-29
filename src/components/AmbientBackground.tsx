"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

/* Night space: deep near-black blue, very low chroma */
const SPACE_SKY = `
  radial-gradient(ellipse 90% 60% at 50% 8%, rgba(18, 24, 42, 0.55), transparent 58%),
  radial-gradient(ellipse 55% 40% at 80% 78%, rgba(12, 16, 28, 0.45), transparent 55%),
  radial-gradient(ellipse 45% 35% at 15% 65%, rgba(10, 14, 24, 0.4), transparent 50%)
`;

/* Snowy overcast: gray + white soft bands — no blue cast */
const SNOW_SKY = `
  radial-gradient(ellipse 110% 65% at 50% -5%, rgba(255, 255, 255, 0.95), transparent 55%),
  radial-gradient(ellipse 55% 38% at 22% 30%, rgba(255, 255, 255, 0.55), transparent 62%),
  radial-gradient(ellipse 50% 34% at 78% 24%, rgba(245, 245, 247, 0.6), transparent 58%),
  radial-gradient(ellipse 70% 42% at 35% 68%, rgba(190, 190, 196, 0.28), transparent 65%),
  radial-gradient(ellipse 65% 38% at 72% 72%, rgba(210, 210, 214, 0.32), transparent 60%),
  linear-gradient(
    180deg,
    #b8b8be 0%,
    #c9c9ce 18%,
    #dbdbdf 38%,
    #e8e8eb 58%,
    #f2f2f4 78%,
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
    <div className="ambient-background pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div
        className="absolute inset-0 transition-[opacity,background] duration-500"
        style={{ background: isDark ? SPACE_SKY : SNOW_SKY }}
      />

      {!reducedMotion && <HeroScene />}

      {reducedMotion && (
        <div className="absolute inset-0 opacity-45">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: isDark
                ? `radial-gradient(1.5px 1.5px at 14% 20%, #e8eaf0, transparent),
                   radial-gradient(1px 1px at 30% 48%, #9aa0b0, transparent),
                   radial-gradient(2px 2px at 52% 24%, #f0f1f5, transparent),
                   radial-gradient(1px 1px at 68% 62%, #b0b4c0, transparent),
                   radial-gradient(1.5px 1.5px at 82% 34%, #e8eaf0, transparent),
                   radial-gradient(1px 1px at 40% 78%, #8a90a0, transparent)`
                : `radial-gradient(2.5px 2.5px at 20% 18%, #ffffff, transparent),
                   radial-gradient(2px 2px at 42% 36%, #e8e8eb, transparent),
                   radial-gradient(3px 3px at 64% 22%, #ffffff, transparent),
                   radial-gradient(2px 2px at 78% 48%, #d8d8dc, transparent),
                   radial-gradient(2.5px 2.5px at 34% 64%, #ffffff, transparent)`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
            }}
          />
        </div>
      )}
    </div>
  );
}
