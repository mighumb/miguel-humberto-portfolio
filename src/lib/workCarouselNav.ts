import {
  registerWorkCarouselMotion,
  stopWorkCarouselMotion,
} from "@/lib/workDragScroll";

/** Slow cinematic glide for arrow prev/next (feels composed, not snappy). */
const ARROW_SCROLL_MIN_MS = 1050;
const ARROW_SCROLL_MAX_MS = 1400;
/** ~1160ms for a typical mobile card step (~370px). */
const ARROW_SCROLL_PX_PER_MS = 0.32;

function getWorkCards(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-project-id]"));
}

/** Long ease-in and ease-out so the card floats rather than snaps. */
function easeInOutQuint(t: number) {
  return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2;
}

/**
 * Left inset for face-on focus.
 * Prefer padding-left (matches header px-6 / md:px-10); never read the end spacer.
 */
export function getFocusInset(container: HTMLElement) {
  const padding = Number.parseFloat(getComputedStyle(container).paddingLeft) || 0;
  if (padding >= 8 && padding <= 80) return padding;

  const gutter = container.querySelector<HTMLElement>("[data-work-gutter='start']");
  if (gutter) {
    const width = gutter.offsetWidth;
    if (width >= 8 && width <= 80) return width;
  }

  return window.matchMedia("(min-width: 768px)").matches ? 40 : 24;
}

function getCarouselGap(container: HTMLElement) {
  const styles = getComputedStyle(container);
  return (
    Number.parseFloat(styles.gap) || Number.parseFloat(styles.columnGap) || 0
  );
}

/**
 * Ideal scrollLeft so a card sits face-on at the shared left inset.
 * Same formula for every card (including the first): offsetLeft - padding/inset.
 * With pl-6 / md:pl-10, card 0 → 0 and later cards keep the same screen edge.
 */
export function getCardIdealScroll(
  container: HTMLElement,
  card: HTMLElement,
  _index = -1,
) {
  return Math.max(0, card.offsetLeft - getFocusInset(container));
}

/**
 * Trailing spacer so max scrollLeft can reach the last card's face-on position.
 */
export function getWorkCarouselEndGutterWidth(container: HTMLElement) {
  const cards = getWorkCards(container);
  const last = cards[cards.length - 1];
  if (!last) return getFocusInset(container);

  if (last.offsetWidth < 32) return getFocusInset(container);

  const focusInset = getFocusInset(container);
  const gap = getCarouselGap(container);
  // Trailing space so max scrollLeft reaches last.offsetLeft - focusInset.
  // Subtract gap because the EndScrollGutter is a flex child and the flex
  // gap is applied once more before it, adding gap to scrollWidth.
  return Math.max(0, Math.ceil(container.clientWidth - focusInset - last.offsetWidth - gap));
}

export function getFocusedWorkCardIndex(container: HTMLElement) {
  const cards = getWorkCards(container);
  if (!cards.length) return 0;

  const scrollLeft = container.scrollLeft;

  let bestIndex = 0;
  let bestDistance = Infinity;

  cards.forEach((card, index) => {
    const idealScroll = getCardIdealScroll(container, card, index);
    const distance = Math.abs(scrollLeft - idealScroll);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function getWorkCardScrollTarget(container: HTMLElement, index: number) {
  const cards = getWorkCards(container);
  const card = cards[index];
  if (!card) return null;

  return getCardIdealScroll(container, card, index);
}

export function scrollWorkCarouselToIndex(
  container: HTMLElement,
  index: number,
  smooth = true,
) {
  const target = getWorkCardScrollTarget(container, index);
  if (target === null) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!smooth || reducedMotion) {
    container.scrollLeft = target;
    return;
  }

  const start = container.scrollLeft;
  const delta = target - start;
  if (Math.abs(delta) < 0.5) return;

  // Replace any in-flight glide/momentum before starting a new one.
  stopWorkCarouselMotion(container);

  const duration = Math.min(
    ARROW_SCROLL_MAX_MS,
    Math.max(ARROW_SCROLL_MIN_MS, Math.abs(delta) / ARROW_SCROLL_PX_PER_MS),
  );

  let raf = 0;
  const startTime = performance.now();

  const stop = () => {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    unregister();
  };

  const unregister = registerWorkCarouselMotion(container, stop);

  const tick = (now: number) => {
    const progress = Math.min(1, (now - startTime) / duration);
    container.scrollLeft = start + delta * easeInOutQuint(progress);

    if (progress < 1) {
      raf = requestAnimationFrame(tick);
      return;
    }

    container.scrollLeft = target;
    stop();
    // Custom rAF scroll does not always emit scrollend; settle nav pin state.
    container.dispatchEvent(new Event("scrollend"));
  };

  raf = requestAnimationFrame(tick);
}

export function whenWorkCarouselScrollSettles(
  container: HTMLElement,
  onSettled: () => void,
) {
  const supportsScrollEnd = "onscrollend" in HTMLElement.prototype;

  if (supportsScrollEnd) {
    container.addEventListener("scrollend", onSettled, { once: true });
    return () => container.removeEventListener("scrollend", onSettled);
  }

  let timer = 0;

  const finish = () => {
    container.removeEventListener("scroll", onScroll);
    window.clearTimeout(timer);
    onSettled();
  };

  const onScroll = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(finish, 120);
  };

  container.addEventListener("scroll", onScroll, { passive: true });
  // Cover the slower arrow glide (up to ~1400ms) plus a short settle buffer.
  timer = window.setTimeout(finish, 1700);

  return () => {
    container.removeEventListener("scroll", onScroll);
    window.clearTimeout(timer);
  };
}
