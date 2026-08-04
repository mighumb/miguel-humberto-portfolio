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
