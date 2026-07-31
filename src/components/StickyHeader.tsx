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
      {/* Blur layer: mask-image on parent kills backdrop-filter (stacking
          context prevents sampling page content). Plain div with no mask
          so blur actually works. The fade-out is handled by the gradient
          overlay below, not by masking the blur itself. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full"
        style={{
          background: "var(--header-bg-subtle)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
        aria-hidden
      />
      {/* Gradient overlay that fades the bottom edge into the page bg */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-full"
        style={{
          background: "linear-gradient(to bottom, transparent 50%, var(--bg-primary) 100%)",
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
