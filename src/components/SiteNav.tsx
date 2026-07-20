"use client";

import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { translations } from "@/lib/i18n";

interface SiteNavProps {
  onHome: () => void;
  onContact: () => void;
  showBack?: boolean;
  onBack?: () => void;
}

export default function SiteNav({ onHome, onContact, showBack = false, onBack }: SiteNavProps) {
  const { locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const t = translations[locale];

  return (
    <nav
      className="pointer-events-none absolute inset-x-0 top-0 z-40 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-4 md:px-10 md:pt-5"
      aria-label="Site navigation"
    >
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          type="button"
          onClick={onHome}
          className="cursor-pointer text-sm font-medium tracking-tight text-text-primary transition-opacity hover:opacity-70 md:text-base"
        >
          Miguel Humberto
        </button>
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer text-xs tracking-widest text-text-secondary uppercase transition-colors hover:text-text-primary"
          >
            ← {t.back}
          </button>
        )}
      </div>

      <div className="pointer-events-auto flex items-center gap-4 md:gap-6">
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

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-bg-secondary/80 text-text-secondary backdrop-blur-sm transition-colors hover:text-text-primary"
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41M12 8a4 4 0 11-8 0 4 4 0 018 0z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M14 9.5A6 6 0 116.5 2 4.5 4.5 0 0014 9.5z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={onContact}
          className="cursor-pointer text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          {t.header.contact}
        </button>
      </div>
    </nav>
  );
}
