const MAX_DURATION_MS = 1350;
const MIN_DURATION_MS = 750;

let cancelActiveScroll: (() => void) | null = null;

function easeInOutCubic(progress: number) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function prefersNativePageScroll() {
  return !window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** Smooth, interruptible page scroll for long desktop journeys. */
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

  // Touch browsers already tune momentum and cancellation for the device.
  if (prefersNativePageScroll()) {
    window.scrollTo({ top: targetTop, behavior: "smooth" });
    return;
  }

  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  const duration = Math.min(
    MAX_DURATION_MS,
    Math.max(MIN_DURATION_MS, 600 + Math.abs(distance) * 0.18),
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
    window.scrollTo({ top: startTop + distance * easeInOutCubic(progress) });

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
