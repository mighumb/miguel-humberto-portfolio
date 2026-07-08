"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import {
  applyCardPerspective,
  computeCardFocus,
  flightFilterStyle,
  flightTransformStyle,
  resetCardPerspective,
  restoreCardPerspectives,
  type CardPerspective,
} from "@/lib/workCardFocus";

export type CarouselPauseMode = false | "open" | "closing" | "flight";

export { restoreCardPerspectives };

export function useWorkScrollFocus(
  itemCount: number,
  pauseMode: CarouselPauseMode = false,
  snapshotRef?: React.RefObject<Map<string, CardPerspective> | null>,
) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  const setCardRef = (index: number) => (element: HTMLElement | null) => {
    cardRefs.current[index] = element;
  };

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const resetCards = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      cards.forEach((card) => resetCardPerspective(card));
    };

    // Freeze carousel transforms while modal is open or in shared-element flight.
    // Do not reset to flat — that causes sibling cards to pop on close.
    if (pauseMode === "open" || pauseMode === "flight") {
      return;
    }

    const snapshot = snapshotRef?.current;
    const hadSnapshot = Boolean(snapshot);
    if (snapshot) {
      restoreCardPerspectives(container, snapshot);
      snapshotRef.current = null;
    }

    if (pauseMode === "closing") {
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

        const focus = computeCardFocus(card, container);
        const idealScroll = card.offsetLeft - focusInset;
        const delta = scrollLeft - idealScroll;
        const step = card.offsetWidth + gap;
        const progress = Math.min(1, Math.abs(delta) / step);

        card.style.transform = `translateY(${focus.articleTranslateY}px)`;
        card.style.zIndex = `${1000 - Math.round(progress * 100)}`;

        if (body) {
          body.style.transformOrigin = "center bottom";
          body.style.transform = flightTransformStyle(focus);
          body.style.opacity = `${focus.bodyOpacity}`;
          body.style.filter = flightFilterStyle(focus);
        }
      });
    };

    if (hadSnapshot) {
      requestAnimationFrame(() => {
        requestAnimationFrame(update);
      });
    } else {
      update();
      requestAnimationFrame(update);
    }

    container.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      container.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [itemCount, pauseMode, snapshotRef]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (pauseMode === "open" || pauseMode === "flight") return;

    const onWheel = (event: WheelEvent) => {
      const { deltaX, deltaY } = event;

      // Trackpad horizontal gestures must use native overflow scrolling.
      if (Math.abs(deltaX) > Math.abs(deltaY)) return;
      if (Math.abs(deltaX) > 2) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      const goingRight = deltaY > 0;
      const atStart = container.scrollLeft <= 0;
      const atEnd = container.scrollLeft >= maxScroll - 1;

      if ((goingRight && atEnd) || (!goingRight && atStart)) return;

      event.preventDefault();
      container.scrollLeft += deltaY;
    };

    container.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", onWheel);
    };
  }, [itemCount, pauseMode]);

  return { scrollRef, setCardRef };
}
