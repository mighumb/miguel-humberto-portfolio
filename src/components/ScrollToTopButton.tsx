"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { scrollPageTo } from "@/lib/pageScroll";

/**
 * The page must have at least this many viewport heights of *scrollable*
 * room before the button is allowed to appear at all — keeps it off short
 * pages entirely, regardless of how far down them you scroll.
 */
const TALL_PAGE_MIN_SCROLLABLE_VIEWPORTS = 1;
/** Fraction of the scrollable distance the reader must cross before reveal. */
const REVEAL_AFTER_SCROLLABLE_FRACTION = 0.35;

/** Floating button back to the top, only for pages tall enough to need it. */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      raf = 0;
      const viewport = window.innerHeight;
      const scrollable = document.documentElement.scrollHeight - viewport;
      const isTallEnough = scrollable > viewport * TALL_PAGE_MIN_SCROLLABLE_VIEWPORTS;
      setVisible(
        isTallEnough && window.scrollY > scrollable * REVEAL_AFTER_SCROLLABLE_FRACTION,
      );
    };

    const onScrollOrResize = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <button
      type="button"
      onClick={() => scrollPageTo(0)}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`scroll-to-top-button fixed right-5 z-[90] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-bg-secondary/90 text-text-secondary shadow-lg backdrop-blur transition-[opacity,transform] duration-300 ease-out hover:bg-bg-tertiary hover:text-text-primary md:right-6 ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-2 opacity-0"
      }`}
      style={{ bottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 10l5-5 5 5"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>,
    document.body,
  );
}
