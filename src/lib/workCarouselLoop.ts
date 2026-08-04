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

function readLoopCopies(container: HTMLElement) {
  const copies = Number.parseInt(container.dataset.workLoopCopies ?? "", 10);
  return Number.isFinite(copies) && copies >= 3 ? copies : 3;
}

/**
 * Several identical cycles are rendered. The viewport rests in the middle
 * cycle, so the scroll position can be shifted by exactly one cycle at either
 * boundary with no visual change. The window returned here is that middle
 * cycle: `[start, end)` spanning one cycle width.
 */
export function getWorkLoopMetrics(container: HTMLElement): WorkLoopMetrics | null {
  const loopSize = Number.parseInt(container.dataset.workLoopSize ?? "", 10);
  if (!Number.isFinite(loopSize) || loopSize < 1) return null;

  const copies = readLoopCopies(container);
  const middleCycle = Math.floor(copies / 2);

  const cards = Array.from(
    container.querySelectorAll<HTMLElement>("[data-project-id]"),
  );
  const middleFirst = cards[loopSize * middleCycle];
  const nextFirst = cards[loopSize * (middleCycle + 1)];
  if (!middleFirst || !nextFirst) return null;

  const inset = getLoopFocusInset(container);
  const start = Math.max(0, middleFirst.offsetLeft - inset);
  const end = Math.max(0, nextFirst.offsetLeft - inset);
  const cycleWidth = end - start;
  if (cycleWidth <= 1) return null;

  return { start, end, cycleWidth };
}

/**
 * Maps any scroll value into the middle cycle window. Used by our own
 * JS-driven motion (arrow glide, desktop drag momentum), where reprogramming
 * scrollLeft every frame is expected and does not fight browser inertia.
 */
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

/**
 * Silently re-centres into the middle cycle. Call this only when the carousel
 * is idle: writing scrollLeft during a native inertial fling (touch, wheel,
 * trackpad) cancels the fling, which reads as the scroll snapping to a stop.
 * The extra cycles on each side give a single gesture enough runway to never
 * reach a real DOM edge before it settles.
 */
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

/**
 * Last-resort wrap while the carousel is still moving.
 *
 * Chained fast swipes never leave an idle gap, so the position can keep
 * travelling until it runs off the rendered strip and leaves empty space where
 * cards should be. Wrapping this close to the edge costs at most a hitch in the
 * current scroll animation, and only after many cycles without a pause, whereas
 * wrapping at every cycle boundary would fight inertia constantly.
 *
 * The margin is measured from the real DOM edges of the strip. Using
 * `2 × cycleWidth` previously overlapped the middle-cycle resting position
 * (with 5 copies that rest starts at exactly two cycles), so the first frame of
 * a rightward swipe already wrapped — on iOS that kills native fling and reads
 * as snapping to the first card.
 */
export function enforceWorkLoopBounds(container: HTMLElement) {
  const metrics = getWorkLoopMetrics(container);
  if (!metrics) return false;

  const margin = Math.max(container.clientWidth, metrics.cycleWidth * 0.5);
  const maxScroll = container.scrollWidth - container.clientWidth;
  const scrollLeft = container.scrollLeft;
  if (scrollLeft > margin && scrollLeft < maxScroll - margin) return false;

  const normalized = normalizeWorkLoopScroll(container, scrollLeft);
  if (Math.abs(normalized - scrollLeft) < 0.5) return false;

  container.scrollLeft = normalized;
  return true;
}
