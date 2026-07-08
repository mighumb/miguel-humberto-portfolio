"use client";

import { useEffect, useRef } from "react";

const CARD_PERSPECTIVE = 1100;
const MAX_ROTATE_Y = 17;
const MAX_TRANSLATE_Z = -250;
const MAX_SHIFT_Y = 40;
const MAX_BLUR = 0.65;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function syncMetaToVisual(visual: HTMLElement, meta: HTMLElement) {
  meta.style.transform = "";
  meta.style.width = "";

  const visualRect = visual.getBoundingClientRect();
  const metaRect = meta.getBoundingClientRect();
  const offsetX = visualRect.left - metaRect.left;

  if (Math.abs(offsetX) >= 0.5) {
    meta.style.transform = `translateX(${offsetX}px)`;
  }

  meta.style.width = `${visualRect.width}px`;
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
        const meta = card.querySelector<HTMLElement>(".work-card-meta");

        if (reducedMotion) {
          card.style.transform = "";
          card.style.zIndex = "";
          if (visual) {
            visual.style.transform = "";
            visual.style.opacity = "";
            visual.style.filter = "";
            visual.style.boxShadow = "";
          }
          if (meta) {
            meta.style.transform = "";
            meta.style.width = "";
            meta.style.opacity = "";
          }
          return;
        }

        const idealScroll = card.offsetLeft - focusInset;
        const delta = scrollLeft - idealScroll;
        const step = card.offsetWidth + gap;
        const progress = Math.min(1, Math.abs(delta) / step);
        const direction = step === 0 ? 0 : delta / step;

        const translateY = progress * MAX_SHIFT_Y;
        const translateZ = progress * MAX_TRANSLATE_Z;
        const rotateY = clamp(direction * -MAX_ROTATE_Y, -MAX_ROTATE_Y, MAX_ROTATE_Y);
        const opacity = 1 - progress * 0.12;
        const blur = progress * MAX_BLUR;

        card.style.transform = `translateY(${translateY}px)`;
        card.style.zIndex = `${1000 - Math.round(progress * 100)}`;

        if (visual) {
          visual.style.transformOrigin = "center bottom";
          visual.style.transform = [
            `perspective(${CARD_PERSPECTIVE}px)`,
            `translate3d(0, 0, ${translateZ}px)`,
            `rotateY(${rotateY}deg)`,
          ].join(" ");
          visual.style.opacity = `${opacity}`;
          visual.style.filter = blur > 0.05 ? `blur(${blur}px)` : "";
          visual.style.boxShadow = "";
        }

        if (meta) {
          meta.style.opacity = `${opacity}`;
        }

        if (visual && meta) {
          syncMetaToVisual(visual, meta);
        }
      });
    };

    update();
    requestAnimationFrame(update);

    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [itemCount]);

  return { scrollRef, setCardRef };
}
