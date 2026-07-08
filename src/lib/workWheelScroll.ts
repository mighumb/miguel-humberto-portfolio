const WHEEL_GAIN = 1.15;
const MIN_CARD_STEP_RATIO = 0.2;
const MAX_CARD_STEP_RATIO = 2.8;
const DELTA_NORMALIZER = 36;
const SMOOTH_FACTOR = 0.16;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getCardStep(container: HTMLElement) {
  const card = container.querySelector<HTMLElement>("[data-project-id]");
  if (!card) return 640;

  const styles = getComputedStyle(container);
  const gap =
    Number.parseFloat(styles.gap) || Number.parseFloat(styles.columnGap) || 24;

  return card.offsetWidth + gap;
}

function normalizeWheelDelta(event: WheelEvent) {
  let delta = event.deltaY;

  if (event.deltaMode === 1) {
    delta *= 28;
  } else if (event.deltaMode === 2) {
    delta *= window.innerHeight;
  }

  return delta;
}

export function isProjectsSectionActive(
  stage: HTMLElement,
  container: HTMLElement,
): boolean {
  const stageRect = stage.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  const visibleTop = Math.max(stageRect.top, 0);
  const visibleBottom = Math.min(stageRect.bottom, viewportHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);

  if (stageRect.height <= 0) return false;
  if (visibleHeight / stageRect.height < 0.38) return false;

  const viewportMid = viewportHeight * 0.5;
  if (viewportMid < stageRect.top || viewportMid > stageRect.bottom) return false;

  const card = container.querySelector<HTMLElement>("[data-project-id]");
  const visual = card?.querySelector<HTMLElement>(".work-card-visual");
  const meta = card?.querySelector<HTMLElement>(".work-card-meta");

  if (!visual || !meta) return false;

  const visualRect = visual.getBoundingClientRect();
  const metaRect = meta.getBoundingClientRect();

  if (metaRect.bottom < viewportHeight * 0.14) return false;
  if (visualRect.top > viewportHeight * 0.88) return false;

  return true;
}

export function attachWorkWheelScroll(
  container: HTMLElement,
  stage: HTMLElement,
  {
    isEnabled = () => true,
  }: {
    isEnabled?: () => boolean;
  } = {},
) {
  let targetLeft = container.scrollLeft;
  let frameId = 0;

  const stopAnimation = () => {
    if (frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  };

  const stepAnimation = () => {
    const current = container.scrollLeft;
    const delta = targetLeft - current;

    if (Math.abs(delta) < 0.75) {
      container.scrollLeft = targetLeft;
      frameId = 0;
      return;
    }

    container.scrollLeft = current + delta * SMOOTH_FACTOR;
    frameId = requestAnimationFrame(stepAnimation);
  };

  const ensureAnimation = () => {
    if (!frameId) {
      frameId = requestAnimationFrame(stepAnimation);
    }
  };

  const onWheel = (event: WheelEvent) => {
    if (!isEnabled()) return;

    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    if (absX > absY * 1.1) return;

    const stageRect = stage.getBoundingClientRect();
    const pointerInsideStage =
      event.clientX >= stageRect.left &&
      event.clientX <= stageRect.right &&
      event.clientY >= stageRect.top &&
      event.clientY <= stageRect.bottom;

    if (!pointerInsideStage) return;
    if (!isProjectsSectionActive(stage, container)) return;

    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    const goingRight = event.deltaY > 0;
    const atStart = targetLeft <= 0.5;
    const atEnd = targetLeft >= maxScroll - 0.5;

    if ((goingRight && atEnd) || (!goingRight && atStart)) return;

    event.preventDefault();

    if (!frameId) {
      targetLeft = container.scrollLeft;
    }

    const wheelDelta = normalizeWheelDelta(event);
    const cardStep = getCardStep(container);
    const magnitude = clamp(
      Math.abs(wheelDelta) / DELTA_NORMALIZER,
      MIN_CARD_STEP_RATIO,
      MAX_CARD_STEP_RATIO,
    );
    const direction = Math.sign(wheelDelta) || (goingRight ? 1 : -1);

    targetLeft = clamp(
      targetLeft + direction * cardStep * magnitude * WHEEL_GAIN,
      0,
      maxScroll,
    );

    ensureAnimation();
  };

  stage.addEventListener("wheel", onWheel, { passive: false });

  return () => {
    stopAnimation();
    stage.removeEventListener("wheel", onWheel);
  };
}
