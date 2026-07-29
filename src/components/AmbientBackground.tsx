"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

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
      {/* Atmosphere only — particle motion stays in HeroScene */}
      <div
        className="absolute inset-0 transition-[opacity,background] duration-500"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse 95% 65% at 50% 10%, rgba(56, 72, 128, 0.34), transparent 60%),
              radial-gradient(ellipse 60% 45% at 85% 75%, rgba(30, 40, 88, 0.28), transparent 55%),
              radial-gradient(ellipse 50% 40% at 12% 70%, rgba(22, 30, 64, 0.22), transparent 50%)
            `
            : `
              radial-gradient(ellipse 90% 55% at 68% 12%, rgba(255, 255, 255, 0.7), transparent 58%),
              radial-gradient(ellipse 75% 50% at 18% 85%, rgba(176, 204, 230, 0.45), transparent 55%),
              radial-gradient(ellipse 60% 40% at 88% 62%, rgba(210, 226, 242, 0.4), transparent 50%),
              linear-gradient(180deg,
                #cfe0f4 0%,
                #dde9f6 26%,
                #eef3f9 58%,
                #f5f7fa 100%
              )
            `,
        }}
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
