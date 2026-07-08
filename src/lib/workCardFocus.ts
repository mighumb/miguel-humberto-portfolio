export const CARD_PERSPECTIVE = 1100;
export const MAX_ROTATE_Y = 17;
export const MAX_TRANSLATE_Z = -280;
export const MAX_SHIFT_Y = 40;
export const MAX_BLUR = 1.15;

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

export function computeCardFocus(
  card: HTMLElement,
  container: HTMLElement,
): CardPerspective {
  const gutter = container.firstElementChild as HTMLElement | null;
  const focusInset = gutter?.offsetWidth ?? 24;
  const styles = getComputedStyle(container);
  const gap =
    Number.parseFloat(styles.gap) || Number.parseFloat(styles.columnGap) || 20;

  const scrollLeft = container.scrollLeft;
  const idealScroll = card.offsetLeft - focusInset;
  const delta = scrollLeft - idealScroll;
  const step = card.offsetWidth + gap;
  const progress = Math.min(1, Math.abs(delta) / step);
  const direction = step === 0 ? 0 : delta / step;

  return {
    articleTranslateY: progress * MAX_SHIFT_Y,
    rotateY: clamp(direction * -MAX_ROTATE_Y, -MAX_ROTATE_Y, MAX_ROTATE_Y),
    translateZ: progress * MAX_TRANSLATE_Z,
    bodyOpacity: 1 - progress * 0.14,
    blur: progress * MAX_BLUR,
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
