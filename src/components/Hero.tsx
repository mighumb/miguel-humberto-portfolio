"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { translations } from "@/lib/i18n";
import HeroNav from "./HeroNav";

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
      </div>
    </section>
  );
}
