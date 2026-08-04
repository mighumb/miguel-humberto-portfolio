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
/** Desktop: soft depth growth rate so cards keep receding past 1 step. */
const DESKTOP_DEPTH_FALLOFF = 0.9;

export interface CardPerspective {
  articleTranslateY: number;
  rotateY: number;
  translateZ: number;
  bodyOpacity: number;
  blur: number;
  /** 0..1 distance used for z-index ordering along the curve. */
  depth: number;
}

export const FLAT_PERSPECTIVE: CardPerspective = {
  articleTranslateY: 0,
  rotateY: 0,
  translateZ: 0,
  bodyOpacity: 1,
  blur: 0,
  depth: 0,
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

/**
 * Desktop depth curve: keeps growing past one card step with diminishing returns,
 * so card 3 is always farther than card 2 (continuous fan).
 * Mobile stays hard-capped at one step (existing feel).
 */
function focusAmount(distanceInSteps: number, mobile: boolean) {
  if (mobile) return Math.min(1, distanceInSteps);
  return 1 - Math.exp(-distanceInSteps * DESKTOP_DEPTH_FALLOFF);
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
  const distance = step === 0 ? 0 : Math.abs(delta) / step;
  const sign = delta === 0 ? 0 : Math.sign(delta);
  const mobile = isMobileViewport();
  const amount = focusAmount(distance, mobile);

  if (mobile) {
    return {
      articleTranslateY: amount * MAX_SHIFT_Y,
      rotateY: clamp(sign * -amount * MAX_ROTATE_Y, -MAX_ROTATE_Y, MAX_ROTATE_Y),
      translateZ: amount * MAX_TRANSLATE_Z_MOBILE,
      bodyOpacity: 1,
      blur: amount * MAX_BLUR_MOBILE,
      depth: amount,
    };
  }

  // Desktop: continuous curve — farther cards keep gaining depth / tilt / blur.
  return {
    articleTranslateY: amount * MAX_SHIFT_Y * 1.15,
    rotateY: clamp(sign * -amount * MAX_ROTATE_Y * 1.25, -22, 22),
    translateZ: amount * MAX_TRANSLATE_Z,
    bodyOpacity: 1 - amount * 0.18,
    blur: amount * MAX_BLUR * 1.15,
    depth: amount,
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
    depth: mix(from.depth, to.depth),
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
  card.style.transform = `translateY(${perspective.articleTranslateY}px)`;
  card.style.zIndex = `${1000 - Math.round(perspective.depth * 100)}`;

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
