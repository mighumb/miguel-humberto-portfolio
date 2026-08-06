/* Native "smooth" crosses the whole page in roughly 600ms, which reads as a jump
   rather than a move. These bounds keep a short hop clearly eased and let a
   full-page journey take its time without dragging. */
const MIN_DURATION_MS = 1400;
const MAX_DURATION_MS = 2200;
const MS_PER_PX = 0.6;

let cancelActiveScroll: (() => void) | null = null;

/* Quart over cubic: softer departure and a much longer landing, which is what
   makes the arrival feel settled instead of cut short. */
function easeInOutQuart(progress: number) {
  return progress < 0.5
    ? 8 * progress * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 4) / 2;
}

/** Smooth, interruptible page scroll for section-to-section journeys. */
export function scrollPageTo(top: number) {
  cancelActiveScroll?.();

  const maxTop = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const targetTop = Math.max(0, Math.min(top, maxTop));

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    Math.abs(targetTop - window.scrollY) < 1
  ) {
    window.scrollTo({ top: targetTop, behavior: "auto" });
    return;
  }

  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  const duration = Math.min(
    MAX_DURATION_MS,
    Math.max(MIN_DURATION_MS, Math.abs(distance) * MS_PER_PX),
  );
  const startTime = performance.now();
  let raf = 0;

  const interruptKeys = new Set([
    "ArrowDown",
    "ArrowUp",
    "End",
    "Home",
    "PageDown",
    "PageUp",
    " ",
  ]);

  const cleanup = () => {
    window.removeEventListener("wheel", cancel);
    window.removeEventListener("touchstart", cancel);
    window.removeEventListener("pointerdown", cancel);
    window.removeEventListener("keydown", cancelOnKey);
    if (cancelActiveScroll === cancel) cancelActiveScroll = null;
  };

  const cancel = () => {
    if (raf) cancelAnimationFrame(raf);
    cleanup();
  };

  const cancelOnKey = (event: KeyboardEvent) => {
    if (interruptKeys.has(event.key)) cancel();
  };

  const step = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration);
    window.scrollTo({ top: startTop + distance * easeInOutQuart(progress) });

    if (progress < 1) {
      raf = requestAnimationFrame(step);
      return;
    }

    cleanup();
  };

  cancelActiveScroll = cancel;
  window.addEventListener("wheel", cancel, { passive: true });
  window.addEventListener("touchstart", cancel, { passive: true });
  window.addEventListener("pointerdown", cancel, { passive: true });
  window.addEventListener("keydown", cancelOnKey);
  raf = requestAnimationFrame(step);
}

export function scrollPageToElement(element: HTMLElement) {
  scrollPageTo(window.scrollY + element.getBoundingClientRect().top);
}
