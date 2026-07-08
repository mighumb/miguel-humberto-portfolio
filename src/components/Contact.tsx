"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";

export default function Contact() {
  const { locale } = useLocale();
  const t = translations[locale];

  return (
    <section id="contact" className="relative z-[2] flex flex-col bg-bg-primary">
      <div className="mx-auto w-full max-w-3xl px-6 py-24 text-center md:px-10 md:py-32">
        <h2 className="text-3xl font-light tracking-tight text-text-primary md:text-5xl">
          {t.contactTitle}
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-text-secondary md:text-lg md:whitespace-nowrap">
          {t.contactSubtitle}
        </p>

        <div className="mt-12 flex flex-col items-center gap-6">
          <a
            href={`mailto:${t.email}`}
            className="text-lg font-medium text-text-primary transition-opacity hover:opacity-70"
          >
            {t.email}
          </a>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <a
              href="https://www.linkedin.com/in/miguel-humberto-a15b4794/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              {t.linkedin}
            </a>
            <span className="text-sm text-accent">{t.cvSoon}</span>
          </div>
        </div>
      </div>

      <footer className="mt-auto px-6 pb-10 pt-16 text-center md:pb-14 md:pt-24">
        <p className="text-xs text-text-secondary">
          © {new Date().getFullYear()} Miguel Humberto
        </p>
      </footer>
    </section>
  );
}
