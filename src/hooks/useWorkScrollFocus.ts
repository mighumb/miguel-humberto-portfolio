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
        const visual = card.querySelector<HTMLElement>(".work-card-visual");

        if (reducedMotion) {
          card.style.transform = "";
          if (visual) {
            visual.style.opacity = "";
            visual.style.transform = "";
            visual.style.filter = "";
            visual.style.boxShadow = "";
            visual.style.setProperty("--media-scale", "1");
            visual.style.setProperty("--media-shift", "0px");
          }
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
        const opacity = 1 - progress * 0.12;
        const blur = progress * MAX_BLUR;
        const mediaScale = 1.06 - progress * 0.06;
        const mediaShift = progress * -12;

        card.style.transform = `translateY(${translateY}px)`;
        card.style.zIndex = `${1000 - Math.round(progress * 100)}`;

        if (visual) {
          visual.style.opacity = `${opacity}`;
          visual.style.transform = [
            `translateZ(${translateZ}px)`,
            `rotateY(${rotateY}deg)`,
            `scale(${scale})`,
          ].join(" ");
          visual.style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
          visual.style.boxShadow =
            progress > 0.02
              ? `0 ${12 + progress * 20}px ${32 + progress * 28}px rgba(0, 0, 0, ${0.05 + progress * 0.1})`
              : "0 20px 40px rgba(0, 0, 0, 0.07)";
          visual.style.setProperty("--media-scale", `${mediaScale}`);
          visual.style.setProperty("--media-shift", `${mediaShift}px`);
        }
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
