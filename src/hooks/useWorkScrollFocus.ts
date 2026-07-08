"use client";

import { useEffect, useRef } from "react";

const MAX_ROTATE_Y = 14;
const MAX_TRANSLATE_Z = -220;
const MAX_SHIFT_Y = 44;
const SCALE_DROP = 0.1;
const MAX_BLUR = 0.6;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useWorkScrollFocus(itemCount: number) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const setCardRef = (index: number) => (element: HTMLElement | null) => {
    cardRefs.current[index] = element;
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const update = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!cards.length) return;

      const scrollLeft = container.scrollLeft;
      const gutter = container.firstElementChild as HTMLElement | null;
      const focusInset = gutter?.offsetWidth ?? 24;
      const styles = getComputedStyle(container);
      const gap =
        Number.parseFloat(styles.gap) || Number.parseFloat(styles.columnGap) || 20;

      cards.forEach((card) => {
        if (reducedMotion) {
          card.style.transform = "";
          card.style.opacity = "";
          card.style.filter = "";
          card.style.boxShadow = "";
          card.style.setProperty("--media-scale", "1");
          card.style.setProperty("--media-shift", "0px");
          return;
        }

        const idealScroll = card.offsetLeft - focusInset;
        const delta = scrollLeft - idealScroll;
        const step = card.offsetWidth + gap;
        const progress = Math.min(1, Math.abs(delta) / step);
        const direction = step === 0 ? 0 : delta / step;

        const scale = 1 - progress * SCALE_DROP;
        const translateY = progress * MAX_SHIFT_Y;
        const translateZ = progress * MAX_TRANSLATE_Z;
        const rotateY = clamp(direction * -MAX_ROTATE_Y, -MAX_ROTATE_Y, MAX_ROTATE_Y);
        const opacity = 1 - progress * 0.18;
        const blur = progress * MAX_BLUR;
        const mediaScale = 1.06 - progress * 0.06;
        const mediaShift = progress * -12;

        card.style.transform = [
          `translateY(${translateY}px)`,
          `translateZ(${translateZ}px)`,
          `rotateY(${rotateY}deg)`,
          `scale(${scale})`,
        ].join(" ");
        card.style.opacity = `${opacity}`;
        card.style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
        card.style.boxShadow =
          progress > 0.02
            ? `0 ${12 + progress * 20}px ${32 + progress * 28}px rgba(0, 0, 0, ${0.05 + progress * 0.1})`
            : "0 24px 48px rgba(0, 0, 0, 0.08)";
        card.style.setProperty("--media-scale", `${mediaScale}`);
        card.style.setProperty("--media-shift", `${mediaShift}px`);
        card.style.zIndex = `${1000 - Math.round(progress * 100)}`;
      });
    };

    update();
    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [itemCount]);

  return { scrollRef, setCardRef };
}
