"use client";

import { useLayoutEffect, useRef } from "react";
import {
  applyCardPerspective,
  computeCardFocus,
  resetCardPerspective,
  restoreCardPerspectives,
  type CardPerspective,
} from "@/lib/workCardFocus";
import { attachWorkDragScroll } from "@/lib/workDragScroll";
import { recenterWorkLoopScroll } from "@/lib/workCarouselLoop";

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

    let raf = 0;
    let idleTimer = 0;

    const update = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!cards.length) return;

      cards.forEach((card) => {
        if (reducedMotion) {
          resetCardPerspective(card);
          return;
        }

        applyCardPerspective(card, computeCardFocus(card, container));
      });
    };

    // Re-centre into the middle cycle only once the scroll has settled. Doing it
    // mid-scroll would rewrite scrollLeft during a native fling and kill the
    // inertia — the loop boundary sits on a card, so that read as snapping to it.
    const scheduleRecenter = () => {
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => {
        recenterWorkLoopScroll(container);
        update();
      }, 140);
    };

    // Coalesce scroll events to one paint per frame — keeps 3D (incl. blur) intact.
    const scheduleUpdate = () => {
      scheduleRecenter();
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
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

    container.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      container.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [itemCount, pauseMode, snapshotRef]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    if (pauseMode === "open" || pauseMode === "flight") return;

    return attachWorkDragScroll(container);
  }, [itemCount, pauseMode]);

  return { scrollRef, setCardRef };
}
