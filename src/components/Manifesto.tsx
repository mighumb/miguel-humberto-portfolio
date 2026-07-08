"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";

export default function Manifesto() {
  const { locale } = useLocale();
  const t = translations[locale];

  return (
    <section className="manifesto-section relative z-[2] bg-bg-primary">
      <div className="mx-auto max-w-3xl px-6 pb-20 pt-8 text-center md:px-10 md:pb-28 md:pt-12">
        <h2 className="mb-8 text-3xl font-light tracking-tight text-text-primary md:mb-12 md:text-5xl">
          {t.manifestoTitle}
        </h2>
        <div className="space-y-6">
          {t.manifesto.map((paragraph, i) => (
            <p
              key={i}
              className="text-base leading-relaxed text-text-secondary md:text-lg md:leading-relaxed"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
