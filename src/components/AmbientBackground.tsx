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
      {/* Atmospheric wash behind particles */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse 90% 60% at 50% 18%, rgba(48, 62, 110, 0.28), transparent 58%),
              radial-gradient(ellipse 70% 50% at 80% 80%, rgba(28, 36, 72, 0.22), transparent 55%),
              radial-gradient(ellipse 50% 40% at 15% 70%, rgba(20, 28, 56, 0.18), transparent 50%)
            `
            : `
              radial-gradient(ellipse 100% 70% at 50% 0%, rgba(210, 224, 240, 0.55), transparent 62%),
              radial-gradient(ellipse 80% 50% at 20% 100%, rgba(230, 236, 244, 0.4), transparent 55%),
              linear-gradient(180deg, rgba(236, 241, 248, 0.35) 0%, transparent 48%)
            `,
        }}
      />

      {!reducedMotion && <HeroScene />}

      {reducedMotion && (
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: isDark
                ? `radial-gradient(1px 1px at 12% 18%, var(--hero-particle-alt), transparent),
                   radial-gradient(1px 1px at 28% 42%, var(--hero-particle), transparent),
                   radial-gradient(1.5px 1.5px at 46% 22%, var(--hero-particle-alt), transparent),
                   radial-gradient(1px 1px at 62% 58%, var(--hero-particle), transparent),
                   radial-gradient(1px 1px at 78% 30%, var(--hero-particle-alt), transparent),
                   radial-gradient(1.5px 1.5px at 88% 68%, var(--hero-particle), transparent),
                   radial-gradient(1px 1px at 34% 76%, var(--hero-particle-alt), transparent),
                   radial-gradient(1px 1px at 54% 84%, var(--hero-particle), transparent)`
                : `radial-gradient(2px 2px at 18% 12%, var(--hero-particle-alt), transparent),
                   radial-gradient(1.5px 1.5px at 36% 28%, var(--hero-particle), transparent),
                   radial-gradient(2px 2px at 58% 16%, var(--hero-particle-alt), transparent),
                   radial-gradient(1.5px 1.5px at 72% 40%, var(--hero-particle), transparent),
                   radial-gradient(2px 2px at 84% 22%, var(--hero-particle-alt), transparent),
                   radial-gradient(1.5px 1.5px at 44% 52%, var(--hero-particle), transparent)`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "100% 100%",
            }}
          />
        </div>
      )}
    </div>
  );
}
