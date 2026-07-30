"use client";

import { useCallback } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { translations } from "@/lib/i18n";
import HeroNav from "./HeroNav";

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function smoothScrollTo(target: number, duration: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo(0, target);
    return;
  }
  const start = window.scrollY;
  const distance = target - start;
  const startTime = performance.now();
  function step(now: number) {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, start + distance * easeInOutSine(progress));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const MOBILE_TAGLINE_BREAKS = [
  "from concept",
  "du concept",
  "entre UI, motion et",
] as const;

/** On mobile, start a new line at a known phrase in the tagline. */
function MobileTaglineBreak({ text }: { text: string }) {
  const breakAt = MOBILE_TAGLINE_BREAKS.find((phrase) => text.includes(phrase)) ?? null;

  if (!breakAt) return text;

  const index = text.indexOf(breakAt);
  if (index <= 0) return text;

  const before = text.slice(0, index);
  const after = text.slice(index);
  // FR has a comma before "du concept"; drop it on the mobile break so the
  // line does not look like the end of a sentence (same phrase continues).
  const beforeMobile = before.replace(/,\s*$/, "").trimEnd();

  return (
    <>
      <span className="md:hidden">{beforeMobile}</span>
      <span className="hidden md:inline">{before}</span>
      <br className="md:hidden" />
      {after}
    </>
  );
}

export default function Hero() {
  const { locale } = useLocale();
  const { mode } = useTheme();
  const t = translations[locale];
  const copy = t.modes[mode];

  const handleScrollToWork = useCallback(() => {
    const section = document.getElementById("projects");
    if (!section) return;
    const vh = window.innerHeight;
    // Account for the fixed sticky header so equal breathing room appears
    // above and below the section inside the available content area.
    const navEl = document.querySelector<HTMLElement>(".site-sticky-header");
    const navH = navEl ? navEl.offsetHeight : Math.min(vh * 0.055, 52);
    const target = section.offsetTop + section.offsetHeight / 2 - vh / 2 - navH / 2;
    smoothScrollTo(Math.max(0, target), 1300);
  }, []);

  return (
    <section
      className="relative flex h-[calc(100svh-min(5.5svh,3.25rem))] w-full flex-col"
      aria-label="Introduction"
    >
      <HeroNav />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-12 text-center md:px-10 md:pb-16">
        <h1
          id="hero-title"
          className="text-4xl font-light tracking-tight text-text-primary md:text-6xl lg:text-7xl"
        >
          Miguel Humberto
        </h1>
        <p className="mt-4 text-lg font-medium text-text-secondary md:text-xl">
          {copy.role}
        </p>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
          <MobileTaglineBreak text={copy.tagline} />
        </p>

        <button
          type="button"
          onClick={handleScrollToWork}
          className="hero-arrow mt-12 cursor-pointer border-0 bg-transparent p-2 text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label="Scroll to work"
        >
          <svg
            width="44"
            height="25"
            viewBox="0 0 28 16"
            fill="none"
            aria-hidden
            className="hero-arrow-chevron"
          >
            <defs>
              <linearGradient id="chevron-l" x1="1" y1="1" x2="14" y2="14" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
              </linearGradient>
              <linearGradient id="chevron-r" x1="27" y1="1" x2="14" y2="14" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="1" />
              </linearGradient>
            </defs>
            <path d="M1 1 L14 14" stroke="url(#chevron-l)" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M27 1 L14 14" stroke="url(#chevron-r)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
