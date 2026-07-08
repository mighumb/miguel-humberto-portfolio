function getMostVisibleCard(container: HTMLElement): HTMLElement | null {
  const cards = [...container.querySelectorAll<HTMLElement>("[data-project-id]")];
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let bestCard: HTMLElement | null = null;
  let bestScore = 0;

  for (const card of cards) {
    const cardRect = card.getBoundingClientRect();
    const visibleWidth = Math.max(
      0,
      Math.min(cardRect.right, viewportWidth) - Math.max(cardRect.left, 0),
    );

    if (visibleWidth < viewportWidth * 0.12) continue;

    const visual = card.querySelector<HTMLElement>(".work-card-visual");
    const meta = card.querySelector<HTMLElement>(".work-card-meta");
    if (!visual || !meta) continue;

    const visualRect = visual.getBoundingClientRect();
    const metaRect = meta.getBoundingClientRect();
    const contentTop = visualRect.top;
    const contentBottom = metaRect.bottom;
    const contentHeight = contentBottom - contentTop;

    if (contentHeight <= 0) continue;

    const visibleTop = Math.max(contentTop, 0);
    const visibleBottom = Math.min(contentBottom, viewportHeight);
    const visibleHeight = Math.max(0, visibleBottom - visibleTop);
    const visibility = visibleHeight / contentHeight;
    const score = visibleWidth * visibility;

    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  }

  return bestCard;
}

export function isWorkCarouselScrollActive(
  container: HTMLElement,
  pointerY?: number,
): boolean {
  const stage =
    container.closest<HTMLElement>(".work-scroll-stage") ??
    container.closest<HTMLElement>("#projects");

  if (!stage) return false;

  const stageRect = stage.getBoundingClientRect();

  if (pointerY !== undefined) {
    if (pointerY < stageRect.top || pointerY > stageRect.bottom) return false;
  }

  const card = getMostVisibleCard(container);
  if (!card) return false;

  const visual = card.querySelector<HTMLElement>(".work-card-visual");
  const meta = card.querySelector<HTMLElement>(".work-card-meta");
  if (!visual || !meta) return false;

  const visualRect = visual.getBoundingClientRect();
  const metaRect = meta.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  const contentTop = visualRect.top;
  const contentBottom = metaRect.bottom;
  const contentHeight = contentBottom - contentTop;
  if (contentHeight <= 0) return false;

  const focusTop = viewportHeight * 0.18;
  const focusBottom = viewportHeight * 0.86;
  const overlapTop = Math.max(contentTop, focusTop);
  const overlapBottom = Math.min(contentBottom, focusBottom);
  const overlap = overlapBottom - overlapTop;

  if (overlap / contentHeight < 0.5) return false;

  if (metaRect.bottom < viewportHeight * 0.18) return false;
  if (visualRect.top > viewportHeight * 0.78) return false;
  if (metaRect.top > viewportHeight * 0.94) return false;

  return true;
}
