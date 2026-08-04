"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";

export default function Manifesto() {
  const { locale } = useLocale();
  const t = translations[locale];

  return (
    <section className="manifesto-section relative z-[2] bg-bg-primary">
      <div className="mx-auto max-w-2xl px-6 pb-20 pt-[max(7.5rem,14svh)] md:px-10 md:pb-28 md:pt-[max(6rem,10svh)]">
        <h2 className="text-center text-3xl font-light tracking-tight text-text-primary md:text-5xl">
          {t.manifestoTitle}
        </h2>
        <p className="mt-6 text-left text-base text-text-secondary md:text-lg">
          {t.manifesto.map((paragraph, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {paragraph}
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
