"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => (
    <div
      className="h-full w-full"
      style={{ background: "var(--bg-secondary)" }}
      aria-hidden
    />
  ),
});

export default function Hero() {
  const { locale } = useLocale();
  const t = translations[locale];
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <section className="relative w-full" aria-label="Introduction">
      <div className="relative h-[55vh] min-h-[360px] w-full overflow-hidden">
        {reducedMotion ? (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: "var(--bg-secondary)" }}
            aria-hidden
          >
            <div
              className="h-48 w-48 rounded-full opacity-40"
              style={{
                background:
                  "radial-gradient(circle, var(--hero-particle) 0%, transparent 70%)",
              }}
            />
          </div>
        ) : (
          <HeroScene />
        )}
      </div>

      <div className="mx-auto max-w-4xl px-6 pb-16 pt-12 text-center md:px-10">
        <p className="mb-3 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
          Portfolio
        </p>
        <h1 className="text-4xl font-light tracking-tight text-text-primary md:text-6xl lg:text-7xl">
          Your Name
        </h1>
        <p className="mt-4 text-lg font-medium text-text-secondary md:text-xl">
          {t.role}
        </p>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
          {t.tagline}
        </p>
        <div className="mt-10 flex flex-col items-center gap-2">
          <span className="text-xs tracking-widest text-text-secondary uppercase">
            {t.scrollHint}
          </span>
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="animate-bounce text-accent"
            aria-hidden
          >
            <path
              d="M10 4v12M4 10l6 6 6-6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
