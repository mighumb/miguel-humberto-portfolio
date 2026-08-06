export type ThemeColorScheme = "light" | "dark";

/** Matches --bg-primary so browser chrome / status area blends with the hero. */
export const THEME_COLORS: Record<ThemeColorScheme, string> = {
  dark: "#0c0e14",
  light: "#f5f5f7",
};

export function themeColorForMode(mode: "ai" | "craft"): string {
  return mode === "craft" ? THEME_COLORS.light : THEME_COLORS.dark;
}

/** Keep <meta name="theme-color"> in sync with AI/craft (dark/light). */
export function applyThemeColor(theme: ThemeColorScheme) {
  if (typeof document === "undefined") return;

  const color = THEME_COLORS[theme];
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;

  // Standalone / PWA: translucent status bar so page (WebGL) can show through.
  let statusBar = document.querySelector<HTMLMetaElement>(
    'meta[name="apple-mobile-web-app-status-bar-style"]',
  );
  if (!statusBar) {
    statusBar = document.createElement("meta");
    statusBar.name = "apple-mobile-web-app-status-bar-style";
    document.head.appendChild(statusBar);
  }
  // black-translucent = content draws under status bar (white icons).
  statusBar.content = "black-translucent";
}
