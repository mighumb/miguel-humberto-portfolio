import { getCardIdealScroll } from "@/lib/workCarouselNav";

export const CARD_PERSPECTIVE = 1100;
export const MAX_ROTATE_Y = 17;
export const MAX_TRANSLATE_Z = -280;
/**
 * Mobile: pushing side cards this far back shrinks them enough that their left
 * edge drifts inward, reading as a much wider gap than the flex gap actually is.
 */
export const MAX_TRANSLATE_Z_MOBILE = -130;
export const MAX_SHIFT_Y = 40;
export const MAX_BLUR = 1.15;
/** Stronger on mobile so off-axis peeks read clearly on retina. */
export const MAX_BLUR_MOBILE = 3.1;
/** Desktop only: cover reads softer than text at the same body blur. */
export const DESKTOP_COVER_BLUR_MULT = 2.1;

export interface CardPerspective {
  articleTranslateY: number;
  rotateY: number;
  translateZ: number;
  bodyOpacity: number;
  blur: number;
}

export const FLAT_PERSPECTIVE: CardPerspective = {
  articleTranslateY: 0,
  rotateY: 0,
  translateZ: 0,
  bodyOpacity: 1,
  blur: 0,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 767px)").matches;
}

function blurFilter(blurPx: number) {
  return blurPx > 0.08 ? `blur(${blurPx}px)` : "none";
}

export function computeCardFocus(
  card: HTMLElement,
  container: HTMLElement,
): CardPerspective {
  const styles = getComputedStyle(container);
  const gap =
    Number.parseFloat(styles.gap) || Number.parseFloat(styles.columnGap) || 20;

  const scrollLeft = container.scrollLeft;
  const idealScroll = getCardIdealScroll(container, card);
  const delta = scrollLeft - idealScroll;
  const step = card.offsetWidth + gap;
  const progress = Math.min(1, Math.abs(delta) / step);
  const direction = step === 0 ? 0 : delta / step;
  const mobile = isMobileViewport();

  return {
    articleTranslateY: progress * MAX_SHIFT_Y,
    rotateY: clamp(direction * -MAX_ROTATE_Y, -MAX_ROTATE_Y, MAX_ROTATE_Y),
    translateZ: progress * (mobile ? MAX_TRANSLATE_Z_MOBILE : MAX_TRANSLATE_Z),
    // Mobile: no opacity wash on the focused CTA; side cards still blur.
    bodyOpacity: mobile ? 1 : 1 - progress * 0.14,
    blur: progress * (mobile ? MAX_BLUR_MOBILE : MAX_BLUR),
  };
}

export function lerpPerspective(
  from: CardPerspective,
  to: CardPerspective,
  amount: number,
): CardPerspective {
  const mix = (a: number, b: number) => a + (b - a) * amount;

  return {
    articleTranslateY: mix(from.articleTranslateY, to.articleTranslateY),
    rotateY: mix(from.rotateY, to.rotateY),
    translateZ: mix(from.translateZ, to.translateZ),
    bodyOpacity: mix(from.bodyOpacity, to.bodyOpacity),
    blur: mix(from.blur, to.blur),
  };
}

export function flightTransformStyle(perspective: CardPerspective) {
  return `perspective(${CARD_PERSPECTIVE}px) translate3d(0, 0, ${perspective.translateZ}px) rotateY(${perspective.rotateY}deg)`;
}

export function flightFilterStyle(perspective: CardPerspective) {
  return blurFilter(perspective.blur);
}

function clearMediaFilters(card: HTMLElement) {
  const visual = card.querySelector<HTMLElement>(".work-card-visual");
  const meta = card.querySelector<HTMLElement>(".work-card-meta");
  if (visual) {
    visual.style.filter = "";
    visual.style.transformStyle = "";
  }
  if (meta) {
    meta.style.filter = "";
    meta.style.transformStyle = "";
  }
}

export function applyCardPerspective(card: HTMLElement, perspective: CardPerspective) {
  const progress = Math.min(1, Math.abs(perspective.rotateY) / MAX_ROTATE_Y);

  card.style.transform = `translateY(${perspective.articleTranslateY}px)`;
  card.style.zIndex = `${1000 - Math.round(progress * 100)}`;

  const body = card.querySelector<HTMLElement>(".work-card-body");
  if (!body) return;

  body.style.transformOrigin = "center bottom";
  body.style.transform = flightTransformStyle(perspective);
  body.style.opacity = `${perspective.bodyOpacity}`;

  const mobile = isMobileViewport();
  if (mobile) {
    // Mobile: one body filter (Safari-safe). Unchanged.
    body.style.filter = flightFilterStyle(perspective);
    clearMediaFilters(card);
    return;
  }

  // Desktop: stronger blur on cover only; meta keeps the current text blur.
  body.style.filter = "";
  const visual = card.querySelector<HTMLElement>(".work-card-visual");
  const meta = card.querySelector<HTMLElement>(".work-card-meta");
  const textBlur = perspective.blur;
  const coverBlur = perspective.blur * DESKTOP_COVER_BLUR_MULT;
  const textFilter = blurFilter(textBlur);
  const coverFilter = blurFilter(coverBlur);

  if (visual) {
    visual.style.filter = coverFilter;
    visual.style.transformStyle = coverFilter === "none" ? "" : "flat";
  }
  if (meta) {
    meta.style.filter = textFilter;
    meta.style.transformStyle = textFilter === "none" ? "" : "flat";
  }
}

export function captureCardPerspectives(container: HTMLElement): Map<string, CardPerspective> {
  const snapshot = new Map<string, CardPerspective>();

  container.querySelectorAll<HTMLElement>("[data-project-id]").forEach((card) => {
    const id = card.getAttribute("data-project-id");
    if (id) {
      snapshot.set(id, computeCardFocus(card, container));
    }
  });

  return snapshot;
}

export function restoreCardPerspectives(
  container: HTMLElement,
  snapshot: Map<string, CardPerspective>,
): void {
  container.querySelectorAll<HTMLElement>("[data-project-id]").forEach((card) => {
    const id = card.getAttribute("data-project-id");
    if (!id) return;

    const perspective = snapshot.get(id);
    if (perspective) {
      applyCardPerspective(card, perspective);
    }
  });
}

export function resetCardPerspective(card: HTMLElement) {
  card.style.transform = "";
  card.style.zIndex = "";

  const body = card.querySelector<HTMLElement>(".work-card-body");
  if (body) {
    body.style.transform = "";
    body.style.opacity = "";
    body.style.filter = "";
  }

  clearMediaFilters(card);
}
