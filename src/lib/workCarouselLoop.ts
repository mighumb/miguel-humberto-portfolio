interface WorkLoopMetrics {
  start: number;
  end: number;
  cycleWidth: number;
}

function getLoopFocusInset(container: HTMLElement) {
  const padding = Number.parseFloat(getComputedStyle(container).paddingLeft) || 0;
  if (padding >= 8 && padding <= 80) return padding;
  return window.matchMedia("(min-width: 768px)").matches ? 40 : 24;
}

/**
 * Three identical cycles are rendered. The viewport lives in the middle one;
 * crossing either boundary can therefore jump by exactly one cycle with no
 * visual change.
 */
export function getWorkLoopMetrics(container: HTMLElement): WorkLoopMetrics | null {
  const loopSize = Number.parseInt(container.dataset.workLoopSize ?? "", 10);
  if (!Number.isFinite(loopSize) || loopSize < 1) return null;

  const cards = Array.from(
    container.querySelectorAll<HTMLElement>("[data-project-id]"),
  );
  const middleFirst = cards[loopSize];
  const finalFirst = cards[loopSize * 2];
  if (!middleFirst || !finalFirst) return null;

  const inset = getLoopFocusInset(container);
  const start = Math.max(0, middleFirst.offsetLeft - inset);
  const end = Math.max(0, finalFirst.offsetLeft - inset);
  const cycleWidth = end - start;
  if (cycleWidth <= 1) return null;

  return { start, end, cycleWidth };
}

export function normalizeWorkLoopScroll(
  container: HTMLElement,
  value = container.scrollLeft,
) {
  const metrics = getWorkLoopMetrics(container);
  if (!metrics) return value;

  let normalized = value;
  while (normalized < metrics.start) normalized += metrics.cycleWidth;
  while (normalized >= metrics.end) normalized -= metrics.cycleWidth;
  return normalized;
}

export function recenterWorkLoopScroll(container: HTMLElement) {
  const normalized = normalizeWorkLoopScroll(container);
  if (Math.abs(normalized - container.scrollLeft) > 0.5) {
    container.scrollLeft = normalized;
  }
  return normalized;
}

export function getWorkLoopStart(container: HTMLElement) {
  return getWorkLoopMetrics(container)?.start ?? 0;
}
