"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { scrollElementTo, scrollPageTo } from "@/lib/pageScroll";

/**
 * The page must have at least this many viewport heights of *scrollable*
 * room before the button is allowed to appear at all — keeps it off short
 * pages entirely, regardless of how far down them you scroll.
 */
const TALL_PAGE_MIN_SCROLLABLE_VIEWPORTS = 1;
/** Fraction of the scrollable distance the reader must cross before reveal. */
const REVEAL_AFTER_SCROLLABLE_FRACTION = 0.35;
/** The project modal scrolls its own container instead of the window. */
const MODAL_SCROLL_SELECTOR = ".project-modal-scroll";

/**
 * Floating button back to the top, only for pages (or the project modal,
 * which scrolls independently of the page underneath it) tall enough to
 * need it.
 */
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let raf = 0;
    let container: HTMLElement | null = null;

    const update = () => {
      raf = 0;
      const scrollTop = container ? container.scrollTop : window.scrollY;
      const clientHeight = container ? container.clientHeight : window.innerHeight;
      const scrollHeight = container
        ? container.scrollHeight
        : document.documentElement.scrollHeight;
      const scrollable = scrollHeight - clientHeight;
      const isTallEnough = scrollable > clientHeight * TALL_PAGE_MIN_SCROLLABLE_VIEWPORTS;
      setVisible(isTallEnough && scrollTop > scrollable * REVEAL_AFTER_SCROLLABLE_FRACTION);
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    /** The modal mounts/unmounts its own scroll container as it opens/closes. */
    const attachTo = (next: HTMLElement | null) => {
      if (container === next) return;
      container?.removeEventListener("scroll", schedule);
      container = next;
      container?.addEventListener("scroll", schedule, { passive: true });
      schedule();
    };

    const syncContainer = () => {
      attachTo(document.querySelector<HTMLElement>(MODAL_SCROLL_SELECTOR));
    };

    syncContainer();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    // The modal portals in/out of document.body well after this effect runs.
    const bodyObserver = new MutationObserver(syncContainer);
    bodyObserver.observe(document.body, { childList: true, subtree: false });

    return () => {
      if (raf) cancelAnimationFrame(raf);
      container?.removeEventListener("scroll", schedule);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      bodyObserver.disconnect();
    };
  }, []);

  if (!mounted) return null;

  const handleClick = () => {
    const container = document.querySelector<HTMLElement>(MODAL_SCROLL_SELECTOR);
    if (container) {
      scrollElementTo(container, 0);
    } else {
      scrollPageTo(0);
    }
  };

  return createPortal(
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`scroll-to-top-button fixed right-5 z-[210] flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-bg-secondary/90 text-text-secondary shadow-lg backdrop-blur transition-[opacity,transform] duration-300 ease-out hover:bg-bg-tertiary hover:text-text-primary md:right-6 ${
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
