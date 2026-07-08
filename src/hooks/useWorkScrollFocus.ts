"use client";

import { useEffect, useRef } from "react";

const CARD_PERSPECTIVE = 1100;
const MAX_ROTATE_Y = 17;
const MAX_TRANSLATE_Z = -280;
const MAX_SHIFT_Y = 40;
const MAX_BLUR = 1.15;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function useWorkScrollFocus(itemCount: number, paused = false) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const setCardRef = (index: number) => (element: HTMLElement | null) => {
    cardRefs.current[index] = element;
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const resetCards = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      cards.forEach((card) => {
        card.style.transform = "";
        card.style.zIndex = "";
        const body = card.querySelector<HTMLElement>(".work-card-body");
        if (body) {
          body.style.transform = "";
          body.style.opacity = "";
          body.style.filter = "";
        }
      });
    };

    if (paused) {
      resetCards();
      return;
    }

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
        const body = card.querySelector<HTMLElement>(".work-card-body");

        if (reducedMotion) {
          card.style.transform = "";
          card.style.zIndex = "";
          if (body) {
            body.style.transform = "";
            body.style.opacity = "";
            body.style.filter = "";
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
        const opacity = 1 - progress * 0.14;
        const blur = progress * MAX_BLUR;

        card.style.transform = `translateY(${translateY}px)`;
        card.style.zIndex = `${1000 - Math.round(progress * 100)}`;

        if (body) {
          body.style.transformOrigin = "center bottom";
          body.style.transform = [
            `perspective(${CARD_PERSPECTIVE}px)`,
            `translate3d(0, 0, ${translateZ}px)`,
            `rotateY(${rotateY}deg)`,
          ].join(" ");
          body.style.opacity = `${opacity}`;
          body.style.filter = blur > 0.08 ? `blur(${blur}px)` : "";
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
  }, [itemCount, paused]);

  return { scrollRef, setCardRef };
}
