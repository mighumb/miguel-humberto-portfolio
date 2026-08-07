"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import { scrollPageTo, scrollPageToElement } from "@/lib/pageScroll";

interface SiteNavProps {
  className?: string;
  onBrandClick?: () => void;
}

export default function SiteNav({ className = "", onBrandClick }: SiteNavProps) {
  const { locale, setLocale } = useLocale();
  const t = translations[locale];

  return (
    <nav
      className={`mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-[max(1rem,env(safe-area-inset-top,0px))] md:px-10 md:pt-[max(1.25rem,env(safe-area-inset-top,0px))] ${className}`}
      aria-label="Site navigation"
    >
      <a
        href="#"
        onClick={(event) => {
          event.preventDefault();
          if (onBrandClick) {
            onBrandClick();
            return;
          }
          scrollPageTo(0);
        }}
        className="cursor-pointer text-sm font-medium tracking-tight text-text-secondary transition-colors hover:text-text-primary md:text-base"
      >
        Miguel Humberto
      </a>

      <div className="flex items-center gap-4 md:gap-6">
        <div
          className="flex items-center rounded-full bg-bg-secondary/80 p-0.5 text-xs font-medium backdrop-blur-sm"
          role="group"
          aria-label="Language"
        >
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`cursor-pointer rounded-full px-3 py-1.5 transition-colors ${
              locale === "en"
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={locale === "en"}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLocale("fr")}
            className={`cursor-pointer rounded-full px-3 py-1.5 transition-colors ${
              locale === "fr"
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={locale === "fr"}
          >
            FR
          </button>
        </div>

        <a
          href="#contact"
          onClick={(event) => {
            event.preventDefault();
            const contact = document.getElementById("contact");
            if (contact) scrollPageToElement(contact);
          }}
          className="hidden cursor-pointer text-sm font-medium text-text-secondary transition-colors hover:text-text-primary sm:block"
        >
          {t.header.contact}
        </a>
      </div>
    </nav>
  );
}
