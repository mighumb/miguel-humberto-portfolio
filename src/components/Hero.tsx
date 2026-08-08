"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { translations } from "@/lib/i18n";
import HeroNav from "./HeroNav";

const TAGLINE_BREAKS = ["en reliant", "connecting"] as const;

/**
 * Keep the second clause together on every viewport. The literal space after
 * the <br> preserves the sentence in textContent for assistive tech/crawlers;
 * browsers collapse it visually at the start of the new line.
 */
function TaglineBreak({ text }: { text: string }) {
  const breakAt = TAGLINE_BREAKS.find((phrase) => text.includes(phrase)) ?? null;

  if (!breakAt) return text;

  const index = text.indexOf(breakAt);
  if (index <= 0) return text;

  const before = text.slice(0, index);
  const after = text.slice(index);

  return (
    <>
      {before.trimEnd()}
      <br />
      {" "}
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
          <TaglineBreak text={copy.tagline} />
        </p>
      </div>
    </section>
  );
}
