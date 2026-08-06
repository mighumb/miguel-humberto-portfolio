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
import {
  enforceWorkLoopBounds,
  recenterWorkLoopScroll,
} from "@/lib/workCarouselLoop";
import { registerWorkFocusPass } from "@/lib/workFocusSync";

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

    let raf = 0;
    let idleTimer = 0;
    let touching = false;

    // Styling only: the loop wrap calls this back, so it must not wrap again.
    const applyFocusStyles = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!cards.length) return;

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

    const unregisterFocusPass = registerWorkFocusPass(container, applyFocusStyles);

    const update = () => {
      const cards = cardRefs.current.filter(Boolean) as HTMLElement[];
      if (!cards.length) return;

      if (touching) {
        // Finger down: the browser drives the pan from the live scroll offset and
        // there is no momentum to cancel, so the loop can be wrapped every frame
        // for free. Keeping the position pinned inside the middle cycle for the
        // whole drag means the fling that follows always starts with two cycles
        // of cards on each side — that is what makes the scroll endless.
        recenterWorkLoopScroll(container);
      } else {
        // Momentum is running: only step in within one viewport of a real DOM
        // edge, where cutting the fling short beats running out of cards.
        enforceWorkLoopBounds(container);
      }

      applyFocusStyles();
    };

    // Re-centre into the middle cycle once the scroll has settled. Doing it
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

    // A finger landing on the scroller has already cancelled any running momentum,
    // so re-centring is free from here until the touch ends.
    const onTouchStart = () => {
      touching = true;
      window.clearTimeout(idleTimer);
      recenterWorkLoopScroll(container);
    };

    const onTouchEnd = () => {
      touching = false;
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
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
    container.addEventListener("touchcancel", onTouchEnd, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      unregisterFocusPass();
      if (raf) cancelAnimationFrame(raf);
      window.clearTimeout(idleTimer);
      container.removeEventListener("scroll", scheduleUpdate);
      container.removeEventListener("touchstart", onTouchStart);
      container.removeEventListener("touchend", onTouchEnd);
      container.removeEventListener("touchcancel", onTouchEnd);
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
