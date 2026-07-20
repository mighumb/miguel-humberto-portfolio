"use client";

import { createPortal } from "react-dom";
import { useLocale } from "@/contexts/LocaleContext";
import { useScrollLock } from "@/hooks/useScrollLock";
import { translations } from "@/lib/i18n";

interface ContactModalProps {
  onClose: () => void;
}

export default function ContactModal({ onClose }: ContactModalProps) {
  const { locale } = useLocale();
  const t = translations[locale];

  useScrollLock(true);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex flex-col bg-bg-primary"
      role="dialog"
      aria-modal="true"
      aria-label={t.header.contact}
    >
      <div className="flex items-center justify-between px-6 py-4 md:px-10">
        <span className="text-xs tracking-widest text-text-secondary uppercase">
          {t.header.contact}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-y-auto px-6 pb-16 pt-8 md:px-10 md:pt-12">
        <section>
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
        </section>

        <section className="mt-20 text-center md:mt-28">
          <h2 className="text-3xl font-light tracking-tight text-text-primary md:text-5xl">
            {t.contactTitle}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-base text-text-secondary md:text-lg">
            {t.contactSubtitle}
          </p>

          <div className="mt-12 flex flex-col items-center gap-6">
            <a
              href={`mailto:${t.email}`}
              className="cursor-pointer text-lg font-medium text-text-primary transition-opacity hover:opacity-70"
            >
              {t.email}
            </a>

            <div className="flex flex-wrap items-center justify-center gap-6">
              <a
                href="https://www.linkedin.com/in/miguel-humberto-a15b4794/"
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {t.linkedin}
              </a>
              <span className="text-sm text-accent">{t.cvSoon}</span>
            </div>
          </div>
        </section>

        <footer className="mt-auto pt-24 text-center">
          <p className="text-xs text-text-secondary">
            © {new Date().getFullYear()} Miguel Humberto
          </p>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
