"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

const SPACE_SKY = `
  radial-gradient(ellipse 95% 65% at 50% 10%, rgba(56, 72, 128, 0.34), transparent 60%),
  radial-gradient(ellipse 60% 45% at 85% 75%, rgba(30, 40, 88, 0.28), transparent 55%),
  radial-gradient(ellipse 50% 40% at 12% 70%, rgba(22, 30, 64, 0.22), transparent 50%)
`;

/* Overcast winter sky: cool zenith, soft cloud blooms, luminous horizon — not flat gray */
const SNOW_SKY = `
  radial-gradient(ellipse 120% 70% at 50% -8%, rgba(255, 255, 255, 0.92), transparent 52%),
  radial-gradient(ellipse 55% 40% at 18% 28%, rgba(255, 255, 255, 0.55), transparent 60%),
  radial-gradient(ellipse 50% 36% at 82% 22%, rgba(236, 244, 252, 0.65), transparent 58%),
  radial-gradient(ellipse 70% 45% at 30% 62%, rgba(168, 198, 228, 0.35), transparent 65%),
  radial-gradient(ellipse 65% 40% at 78% 70%, rgba(190, 214, 236, 0.4), transparent 60%),
  radial-gradient(ellipse 100% 55% at 50% 110%, rgba(244, 248, 252, 0.95), transparent 55%),
  linear-gradient(
    180deg,
    #7fa4c8 0%,
    #9bb8d6 16%,
    #b7cee6 34%,
    #d0e0f2 52%,
    #e4eef8 72%,
    #f2f6fb 88%,
    #f7f9fc 100%
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
                ? `radial-gradient(1.5px 1.5px at 14% 20%, #f4f7ff, transparent),
                   radial-gradient(1px 1px at 30% 48%, #c5d0ea, transparent),
                   radial-gradient(2px 2px at 52% 24%, #ffffff, transparent),
                   radial-gradient(1px 1px at 68% 62%, #d7dff2, transparent),
                   radial-gradient(1.5px 1.5px at 82% 34%, #f4f7ff, transparent),
                   radial-gradient(1px 1px at 40% 78%, #b8c4dc, transparent)`
                : `radial-gradient(2.5px 2.5px at 20% 18%, #ffffff, transparent),
                   radial-gradient(2px 2px at 42% 36%, #e8eef6, transparent),
                   radial-gradient(3px 3px at 64% 22%, #ffffff, transparent),
                   radial-gradient(2px 2px at 78% 48%, #dce6f2, transparent),
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
