"use client";

import { useLayoutEffect, useRef } from "react";
import {
  applyCardPerspective,
  computeCardFocus,
  resetCardPerspective,
  restoreCardPerspectives,
  type CardPerspective,
} from "@/lib/workCardFocus";
import { attachWorkDragScroll, prefersNativeTouchScroll } from "@/lib/workDragScroll";
import {
  enforceWorkLoopBounds,
  recenterWorkLoopScroll,
} from "@/lib/workCarouselLoop";

export type CarouselPauseMode = false | "open" | "closing" | "flight";

/** Card-steps from the focused position still worth styling each frame. */
const FOCUS_CULL_STEPS = 5;

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
    // Writing scrollLeft during a native inertial fling cancels it on WebKit.
    // Touch already has several cycle-lengths of runway and idle-recenters, so
    // skip the mid-scroll edge wrap there; keep it for JS-driven desktop drag.
    const allowMidScrollWrap = !prefersNativeTouchScroll();

    let raf = 0;
    let idleTimer = 0;

    const update = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!cards.length) return;

      // Never let the scroll reach the end of the rendered strip: past it there
      // are no cards left to show.
      if (allowMidScrollWrap) {
        enforceWorkLoopBounds(container);
      }

      // The loop renders many offscreen copies. Only cards that could be seen
      // get the perspective pass; the cutoff sits well beyond the visible span
      // so a card is always styled before it scrolls into view.
      const styles = getComputedStyle(container);
      const gap =
        Number.parseFloat(styles.gap) || Number.parseFloat(styles.columnGap) || 0;
      const inset = Number.parseFloat(styles.paddingLeft) || 0;
      const step = cards[0].offsetWidth + gap;
      const cutoff = step > 0 ? step * FOCUS_CULL_STEPS : Infinity;
      const scrollLeft = container.scrollLeft;

      cards.forEach((card) => {
        const offset = Math.max(0, card.offsetLeft - inset);
        if (Math.abs(offset - scrollLeft) > cutoff) return;

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
