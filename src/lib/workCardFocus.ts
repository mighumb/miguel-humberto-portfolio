import { getCardIdealScroll } from "@/lib/workCarouselNav";

export const CARD_PERSPECTIVE = 1100;
export const MAX_ROTATE_Y = 17;
/** Desktop asymptote; every farther card still approaches it progressively. */
export const MAX_TRANSLATE_Z = -600;
/**
 * Mobile: pushing side cards this far back shrinks them enough that their left
 * edge drifts inward, reading as a much wider gap than the flex gap actually is.
 */
export const MAX_TRANSLATE_Z_MOBILE = -130;
export const MAX_SHIFT_Y = 40;
export const MAX_BLUR = 1.15;
/** Soft peek blur on mobile — kept near the desktop cover softness. */
export const MAX_BLUR_MOBILE = 1.6;
/** Desktop only: cover reads softer than text at the same body blur. */
export const DESKTOP_COVER_BLUR_MULT = 2.1;
/** Card-steps around the focus that the open/close freeze needs to cover. */
const SNAPSHOT_STEPS = 5;
const DESKTOP_DEPTH_RATE = 0.26;
const DESKTOP_TILT_RATE = 0.36;
/**
 * The tilt sets how steeply each card's top edge slopes, and the next card must
 * clear that slope to keep descending. A steeper cap pushed far cards hundreds
 * of pixels down, past the carousel's padding, so keep it moderate.
 */
const DESKTOP_ROTATE_CAP = 26;
/**
 * Desired descent of the visible top-edge envelope. Perspective compensation
 * below adds the extra Y needed to prevent each new trapezoid from stepping up.
 */
const DESKTOP_SHIFT_RATE = 0.22;
const DESKTOP_SHIFT_Y_LIMIT = 128;
const DESKTOP_BLUR_LIMIT = 2.2;
const DESKTOP_OPACITY_REDUCTION = 0.3;

export interface CardPerspective {
  articleTranslateX: number;
  articleTranslateY: number;
  rotateY: number;
  translateZ: number;
  bodyOpacity: number;
  blur: number;
  /** 0..1 distance used for z-index ordering along the curve. */
  depth: number;
}

export const FLAT_PERSPECTIVE: CardPerspective = {
  articleTranslateX: 0,
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
 * Screen offset of a card edge under `perspective(P) translateZ(z) rotateY(a)`.
 * `localX` is measured from the card centre, which is also the projection centre
 * (transform-origin is `center bottom`).
 *
 * Per the CSS transform matrix, a positive rotateY sends +x away from the
 * viewer, so the near edge stays close to its unrotated position while the far
 * edge shrinks hard. Modelling both edges separately is what keeps the
 * compensation honest.
 */
function projectedEdgeX(localX: number, translateZ: number, rotateYDeg: number) {
  const angle = (rotateYDeg * Math.PI) / 180;
  const rotatedX = localX * Math.cos(angle);
  const rotatedZ = translateZ - localX * Math.sin(angle);
  const depth = CARD_PERSPECTIVE - rotatedZ;
  if (depth <= 1) return localX;
  return (rotatedX * CARD_PERSPECTIVE) / depth;
}

/** Downward screen drift of a top corner; transform-origin is bottom-centre. */
function projectedTopEdgeY(
  localX: number,
  height: number,
  translateZ: number,
  rotateYDeg: number,
) {
  const angle = (rotateYDeg * Math.PI) / 180;
  const rotatedZ = translateZ - localX * Math.sin(angle);
  const depth = CARD_PERSPECTIVE - rotatedZ;
  if (depth <= 1) return 0;
  return height - (height * CARD_PERSPECTIVE) / depth;
}

/**
 * An exponential approach never reaches its limit at a finite card distance.
 * Cards 4–6 therefore remain progressively deeper and more tilted instead of
 * sharing the old hard cap, while the diminishing increments avoid a harsh fan.
 */
function desktopCurve(distanceInSteps: number, rate: number) {
  return 1 - Math.exp(-Math.max(0, distanceInSteps) * rate);
}

function desktopTranslateZ(distanceInSteps: number) {
  return desktopCurve(distanceInSteps, DESKTOP_DEPTH_RATE) * MAX_TRANSLATE_Z;
}

function desktopRotateYAbs(distanceInSteps: number) {
  return desktopCurve(distanceInSteps, DESKTOP_TILT_RATE) * DESKTOP_ROTATE_CAP;
}

/**
 * How far each edge of an off-axis card drifts inward, in px.
 * `toward` is the edge facing the focused card, `away` the outer one.
 */
function desktopEdgeDrift(width: number, distanceInSteps: number) {
  const half = width / 2;
  const translateZ = desktopTranslateZ(distanceInSteps);
  const rotateY = desktopRotateYAbs(distanceInSteps);

  return {
    toward: half - Math.abs(projectedEdgeX(-half, translateZ, rotateY)),
    away: half - Math.abs(projectedEdgeX(half, translateZ, rotateY)),
  };
}

/**
 * Downward drift of the top corners introduced by perspective. The outer corner
 * drops more than the inner one, producing the trapezoid seen on screen.
 */
function desktopTopEdgeDrift(
  width: number,
  height: number,
  distanceInSteps: number,
) {
  const half = width / 2;
  const translateZ = desktopTranslateZ(distanceInSteps);
  const rotateY = desktopRotateYAbs(distanceInSteps);

  return {
    toward: projectedTopEdgeY(-half, height, translateZ, rotateY),
    away: projectedTopEdgeY(half, height, translateZ, rotateY),
  };
}

/**
 * Pull cards toward the focused one just enough that projected edge-to-edge
 * gaps stay equal to the flex gap, while depth / tilt keep increasing.
 *
 * Each gap widens by the outer drift of the nearer card plus the inner drift of
 * the farther one, so pulls accumulate along the fan:
 *   T(n) = T(n-1) + away(n-1) + toward(n)
 */
function desktopGapCompensationX(width: number, distance: number, sign: number) {
  if (distance < 0.001 || sign === 0 || width <= 0) return 0;

  let pull = desktopEdgeDrift(width, distance).toward;

  // Nearer cards sit exactly one step apart in distance, so walking back by
  // whole steps from `distance` keeps the pull continuous while scrolling.
  for (let prev = distance - 1; prev > 0.001; prev -= 1) {
    const drift = desktopEdgeDrift(width, prev);
    pull += drift.away + drift.toward;
  }

  return sign * pull;
}

/**
 * Keep the upper silhouette descending continuously. Without this correction,
 * the outer top corner of one tilted card sits below the inner top corner of the
 * next card, making the farther card look higher despite its lower centre.
 */
function desktopCurveTranslateY(width: number, height: number, distance: number) {
  if (distance < 0.001 || width <= 0 || height <= 0) return 0;

  const current = desktopTopEdgeDrift(width, height, distance);
  let visualNearY =
    desktopCurve(distance, DESKTOP_SHIFT_RATE) * DESKTOP_SHIFT_Y_LIMIT;

  // Add every nearer card's top-edge slope. Walking back from the fractional
  // distance keeps this correction continuous at all scroll positions.
  for (let prev = distance - 1; prev > 0.001; prev -= 1) {
    const drift = desktopTopEdgeDrift(width, height, prev);
    visualNearY += drift.away - drift.toward;
  }

  return visualNearY - current.toward;
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

  if (mobile) {
    const amount = Math.min(1, distance);
    return {
      articleTranslateX: 0,
      articleTranslateY: amount * MAX_SHIFT_Y,
      rotateY: clamp(sign * -amount * MAX_ROTATE_Y, -MAX_ROTATE_Y, MAX_ROTATE_Y),
      translateZ: amount * MAX_TRANSLATE_Z_MOBILE,
      bodyOpacity: 1,
      blur: amount * MAX_BLUR_MOBILE,
      depth: amount,
    };
  }

  // Desktop: continuous curve — farther cards keep gaining depth / tilt / blur.
  // Horizontal compensation keeps visual gaps equal despite perspective shrink.
  const depthAmount = desktopCurve(distance, DESKTOP_DEPTH_RATE);
  const tiltAmount = desktopCurve(distance, DESKTOP_TILT_RATE);
  const translateZ = desktopTranslateZ(distance);
  const body = card.querySelector<HTMLElement>(".work-card-body");

  return {
    articleTranslateX: desktopGapCompensationX(card.offsetWidth, distance, sign),
    articleTranslateY: desktopCurveTranslateY(
      card.offsetWidth,
      body?.offsetHeight ?? card.offsetHeight,
      distance,
    ),
    rotateY: clamp(sign * -desktopRotateYAbs(distance), -DESKTOP_ROTATE_CAP, DESKTOP_ROTATE_CAP),
    translateZ,
    bodyOpacity: 1 - tiltAmount * DESKTOP_OPACITY_REDUCTION,
    blur: tiltAmount * DESKTOP_BLUR_LIMIT,
    depth: depthAmount,
  };
}

export function lerpPerspective(
  from: CardPerspective,
  to: CardPerspective,
  amount: number,
): CardPerspective {
  const mix = (a: number, b: number) => a + (b - a) * amount;

  return {
    articleTranslateX: mix(from.articleTranslateX, to.articleTranslateX),
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
  card.style.transform = `translate(${perspective.articleTranslateX}px, ${perspective.articleTranslateY}px)`;
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

function cardKey(card: HTMLElement) {
  return (
    card.getAttribute("data-work-instance") ?? card.getAttribute("data-project-id")
  );
}

/**
 * Only copies that could be on screen are worth freezing: this runs while a card
 * is being opened, and measuring every loop copy would stall that frame.
 */
function nearbyCards(container: HTMLElement) {
  const cards = Array.from(
    container.querySelectorAll<HTMLElement>("[data-project-id]"),
  );
  if (!cards.length) return cards;

  const styles = getComputedStyle(container);
  const gap =
    Number.parseFloat(styles.gap) || Number.parseFloat(styles.columnGap) || 0;
  const inset = Number.parseFloat(styles.paddingLeft) || 0;
  const step = cards[0].offsetWidth + gap;
  if (step <= 0) return cards;

  const cutoff = step * SNAPSHOT_STEPS;
  const scrollLeft = container.scrollLeft;
  return cards.filter(
    (card) => Math.abs(Math.max(0, card.offsetLeft - inset) - scrollLeft) <= cutoff,
  );
}

export function captureCardPerspectives(container: HTMLElement): Map<string, CardPerspective> {
  const snapshot = new Map<string, CardPerspective>();

  nearbyCards(container).forEach((card) => {
    const id = cardKey(card);
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
    const id = cardKey(card);
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
