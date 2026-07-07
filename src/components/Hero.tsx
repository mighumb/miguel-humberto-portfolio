"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";

const HeroScene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
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
    <section
      className="relative flex min-h-[88vh] w-full items-center justify-center overflow-hidden"
      style={{ background: "var(--bg-primary)" }}
      aria-label="Introduction"
    >
      {!reducedMotion && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <HeroScene />
        </div>
      )}

      {reducedMotion && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <div
            className="h-64 w-64 rounded-full opacity-20"
            style={{
              background:
                "radial-gradient(circle, var(--hero-particle) 0%, transparent 70%)",
            }}
          />
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center md:px-10">
        <p className="mb-3 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
          Portfolio
        </p>
        <h1 className="text-4xl font-light tracking-tight text-text-primary md:text-6xl lg:text-7xl">
          Miguel Humberto
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
