"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { applyThemeColor } from "@/lib/themeColor";

export type PortfolioMode = "ai" | "craft";
export type Theme = "light" | "dark";

const STORAGE_KEY = "portfolio-mode";

interface ThemeContextValue {
  mode: PortfolioMode;
  theme: Theme;
  setMode: (mode: PortfolioMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function modeToTheme(mode: PortfolioMode): Theme {
  return mode === "craft" ? "light" : "dark";
}

function parseMode(value: string | null | undefined): PortfolioMode | null {
  if (value === "ai" || value === "craft") return value;
  return null;
}

function readModeFromUrl(): PortfolioMode | null {
  if (typeof window === "undefined") return null;
  return parseMode(new URLSearchParams(window.location.search).get("mode"));
}

/**
 * Public entry is always AI. Craft stays reachable only via an explicit
 * `?mode=craft` URL while that side of the portfolio is still being built.
 * localStorage is never used to pick the default, so a past craft visit cannot
 * surprise a recruiter who opens the bare site.
 */
function resolveInitialMode(): PortfolioMode {
  return readModeFromUrl() ?? "ai";
}

function syncUrl(mode: PortfolioMode) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set("mode", mode);
  window.history.replaceState(window.history.state, "", url.toString());
}

function applyDocumentMode(mode: PortfolioMode) {
  const theme = modeToTheme(mode);
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.dataset.mode = mode;
  applyThemeColor(theme);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PortfolioMode>("ai");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = resolveInitialMode();
    setModeState(initial);
    applyDocumentMode(initial);
    localStorage.setItem(STORAGE_KEY, initial);
    syncUrl(initial);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    applyDocumentMode(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, mounted]);

  useEffect(() => {
    const onPopState = () => {
      setModeState(readModeFromUrl() ?? "ai");
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const setMode = useCallback((next: PortfolioMode) => {
    setModeState(next);
    syncUrl(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyDocumentMode(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, theme: modeToTheme(mode), setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
