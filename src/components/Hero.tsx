"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import HeroNav from "./HeroNav";

export default function Hero() {
  const { locale } = useLocale();
  const t = translations[locale];

  return (
    <section
      className="relative flex h-[calc(100svh-min(5.5svh,3.25rem))] w-full flex-col"
      aria-label="Introduction"
    >
      <HeroNav />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-12 text-center md:px-10 md:pb-16">
        <h1 className="text-4xl font-light tracking-tight text-text-primary md:text-6xl lg:text-7xl">
          Miguel Humberto
        </h1>
        <p className="mt-4 text-lg font-medium text-text-secondary md:text-xl">
          {t.role}
        </p>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-text-secondary md:text-lg">
          {t.tagline}
        </p>
      </div>
    </section>
  );
}
