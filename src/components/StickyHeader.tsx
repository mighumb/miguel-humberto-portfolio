"use client";

import { useEffect, useState, type RefObject } from "react";
import SiteNav from "./SiteNav";

interface StickyHeaderProps {
  titleRef: RefObject<HTMLElement | null>;
}

export default function StickyHeader({ titleRef }: StickyHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const title = titleRef.current;
    if (!title) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );

    observer.observe(title);
    return () => observer.disconnect();
  }, [titleRef]);

  return (
    <div
      className={`site-sticky-header fixed inset-x-0 top-0 z-50 transition-[opacity,transform] duration-300 ease-out ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-2 opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <SiteNav
        className="relative z-[1] pb-3 md:pb-4"
        onBrandClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      />
    </div>
  );
}
