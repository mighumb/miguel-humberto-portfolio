"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type PortfolioMode = "ai" | "craft";
export type Theme = "light" | "dark";

const STORAGE_KEY = "portfolio-mode";

interface ThemeContextValue {
  mode: PortfolioMode;
  theme: Theme;
  toggleTheme: () => void;
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

function readModeFromStorage(): PortfolioMode | null {
  if (typeof window === "undefined") return null;
  return parseMode(localStorage.getItem(STORAGE_KEY));
}

function resolveInitialMode(): PortfolioMode {
  return readModeFromUrl() ?? readModeFromStorage() ?? "ai";
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
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<PortfolioMode>("ai");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = resolveInitialMode();
    setModeState(initial);
    applyDocumentMode(initial);
    localStorage.setItem(STORAGE_KEY, initial);
    // Keep shareable mode in the URL once resolved (default ai, or craft from storage/URL).
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
      const fromUrl = readModeFromUrl();
      if (fromUrl) {
        setModeState(fromUrl);
        return;
      }
      setModeState(readModeFromStorage() ?? "ai");
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

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next: PortfolioMode = prev === "ai" ? "craft" : "ai";
      syncUrl(next);
      localStorage.setItem(STORAGE_KEY, next);
      applyDocumentMode(next);
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider
      value={{ mode, theme: modeToTheme(mode), toggleTheme, setMode }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
