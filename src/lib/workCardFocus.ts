import { getCardIdealScroll } from "@/lib/workCarouselNav";

export const CARD_PERSPECTIVE = 1100;
export const MAX_ROTATE_Y = 17;
export const MAX_TRANSLATE_Z = -280;
export const MAX_SHIFT_Y = 40;
export const MAX_BLUR = 1.15;
/** Stronger on mobile so off-axis peeks read clearly on retina. */
export const MAX_BLUR_MOBILE = 4.2;

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
    translateZ: progress * MAX_TRANSLATE_Z,
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
  return perspective.blur > 0.08 ? `blur(${perspective.blur}px)` : "none";
}

export function applyCardPerspective(card: HTMLElement, perspective: CardPerspective) {
  const progress = Math.min(1, Math.abs(perspective.rotateY) / MAX_ROTATE_Y);

  card.style.transform = `translateY(${perspective.articleTranslateY}px)`;
  card.style.zIndex = `${1000 - Math.round(progress * 100)}`;

  const body = card.querySelector<HTMLElement>(".work-card-body");
  if (!body) return;

  // Same path as desktop: filter on the 3D body (works in Safari).
  // Media-only filters under preserve-3d were ignored on iOS.
  body.style.transformOrigin = "center bottom";
  body.style.transform = flightTransformStyle(perspective);
  body.style.opacity = `${perspective.bodyOpacity}`;
  body.style.filter = flightFilterStyle(perspective);
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
  if (!body) return;

  body.style.transform = "";
  body.style.opacity = "";
  body.style.filter = "";
}
