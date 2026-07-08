const VIEWPORT_EDGE_PADDING = 40;
const CENTER_TOLERANCE_RATIO = 0.2;

export function isWorkCarouselScrollActive(container: HTMLElement): boolean {
  const card = container.querySelector<HTMLElement>("[data-project-id]");
  if (!card) return false;

  const visual = card.querySelector<HTMLElement>(".work-card-visual");
  const meta = card.querySelector<HTMLElement>(".work-card-meta");
  if (!visual || !meta) return false;

  const visualRect = visual.getBoundingClientRect();
  const metaRect = meta.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  if (visualRect.height <= 0 || metaRect.height <= 0) return false;

  const contentTop = visualRect.top;
  const contentBottom = metaRect.bottom;
  const contentHeight = contentBottom - contentTop;

  if (contentHeight <= 0) return false;

  const visibleTop = Math.max(contentTop, 0);
  const visibleBottom = Math.min(contentBottom, viewportHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const visibleRatio = visibleHeight / contentHeight;

  if (visibleRatio < 0.88) return false;
  if (contentTop < VIEWPORT_EDGE_PADDING) return false;
  if (contentBottom > viewportHeight - VIEWPORT_EDGE_PADDING) return false;

  const contentCenter = (contentTop + contentBottom) / 2;
  const viewportCenter = viewportHeight / 2;
  const maxCenterOffset = viewportHeight * CENTER_TOLERANCE_RATIO;

  return Math.abs(contentCenter - viewportCenter) <= maxCenterOffset;
}
