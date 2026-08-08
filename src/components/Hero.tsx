"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { translations } from "@/lib/i18n";
import HeroNav from "./HeroNav";

const MOBILE_TAGLINE_BREAKS = ["en reliant", "connecting"] as const;

/**
 * On mobile, start a new line at a known phrase in the tagline. The two halves
 * are rendered once each: only the punctuation that the break replaces is
 * duplicated, so assistive tech and crawlers never read the sentence twice.
 */
function MobileTaglineBreak({ text }: { text: string }) {
  const breakAt = MOBILE_TAGLINE_BREAKS.find((phrase) => text.includes(phrase)) ?? null;

  if (!breakAt) return text;

  const index = text.indexOf(breakAt);
  if (index <= 0) return text;

  const before = text.slice(0, index);
  const after = text.slice(index);
  // A comma right before the break reads like a full stop once the line splits
  // there, so it is kept inline on desktop and dropped on mobile. The captured
  // group carries the separating space, which is why the head can be trimmed.
  const comma = before.match(/^(.*?)(,\s*)$/);

  return (
    <>
      {comma ? comma[1].trimEnd() : before}
      {comma && <span className="hidden md:inline">{comma[2]}</span>}
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
    <section className="relative flex w-full flex-col" aria-label="Introduction">
      <HeroNav />

      <div className="relative z-10 flex flex-col items-center px-6 pb-10 pt-[12svh] text-center md:px-10 md:pb-14 md:pt-[16svh]">
        <h1
          id="hero-title"
          className="text-2xl font-light tracking-tight text-text-primary md:text-4xl lg:text-5xl"
        >
          {copy.role}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-secondary md:mt-6 md:text-lg">
          <MobileTaglineBreak text={copy.tagline} />
        </p>
      </div>
    </section>
  );
}
