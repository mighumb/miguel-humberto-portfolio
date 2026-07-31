"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SiteNav from "./SiteNav";

/**
 * Sticky site nav: hidden while the hero title is on screen,
 * visible for the rest of the page scroll (Work, Who I am, Contact).
 */
export default function StickyHeader() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const title = document.getElementById("hero-title");
    if (!title) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0 },
    );

    observer.observe(title);
    return () => observer.disconnect();
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`site-sticky-header fixed inset-x-0 top-0 z-[100] transition-[opacity,transform] duration-300 ease-out ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      {/* Blur extends ~48px below the nav so its hard bottom edge falls in
          the zone where the tint is already transparent — the edge becomes
          invisible. mask/parent-mask both break backdrop-filter in Chrome
          so height overflow is the only way to hide the rectangle. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "calc(100% + 48px)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        aria-hidden
      />
      {/* Tint fades to transparent at 65% of nav height — well before the
          blur edge — so no coloured block is ever visible. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full"
        style={{
          background: "linear-gradient(to bottom, var(--header-bg-subtle) 0%, transparent 65%)",
        }}
        aria-hidden
      />
      <SiteNav
        className="relative z-[1] pb-4 md:pb-5"
        onBrandClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </div>,
    document.body,
  );
}
