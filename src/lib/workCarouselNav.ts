function getWorkCards(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-project-id]"));
}

/** Left inset for face-on focus — padding or start gutter, never the end spacer. */
export function getFocusInset(container: HTMLElement) {
  const gutter = container.querySelector<HTMLElement>("[data-work-gutter='start']");
  if (gutter) {
    const width = gutter.offsetWidth;
    if (width >= 8 && width <= 80) return width;
  }

  const padding = Number.parseFloat(getComputedStyle(container).paddingLeft) || 0;
  if (padding >= 8 && padding <= 80) return padding;

  return window.matchMedia("(min-width: 768px)").matches ? 40 : 24;
}

function getCarouselGap(container: HTMLElement) {
  const styles = getComputedStyle(container);
  return (
    Number.parseFloat(styles.gap) || Number.parseFloat(styles.columnGap) || 0
  );
}

/** Ideal scrollLeft so a card sits face-on at the left inset. First card is always 0. */
export function getCardIdealScroll(container: HTMLElement, card: HTMLElement, index = -1) {
  const cards = getWorkCards(container);
  const cardIndex = index >= 0 ? index : cards.indexOf(card);
  if (cardIndex <= 0) return 0;

  return Math.max(0, card.offsetLeft - getFocusInset(container));
}

/**
 * Trailing spacer width so max scrollLeft can reach the last card's ideal
 * focus, matching the first card's face-on position.
 */
export function getWorkCarouselEndGutterWidth(container: HTMLElement) {
  const cards = getWorkCards(container);
  const last = cards[cards.length - 1];
  if (!last) return getFocusInset(container);

  // Wait until cards are laid out — a 0-width measure invents a huge end spacer.
  if (last.offsetWidth < 32) return getFocusInset(container);

  const focusInset = getFocusInset(container);
  const gap = getCarouselGap(container);
  return Math.max(
    0,
    Math.ceil(container.clientWidth - focusInset - last.offsetWidth - gap),
  );
}

export function getFocusedWorkCardIndex(container: HTMLElement) {
  const cards = getWorkCards(container);
  if (!cards.length) return 0;

  const scrollLeft = container.scrollLeft;

  let bestIndex = 0;
  let bestDistance = Infinity;

  cards.forEach((card, index) => {
    const idealScroll = getCardIdealScroll(container, card, index);
    const distance = Math.abs(scrollLeft - idealScroll);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = index;
    }
  });

  return bestIndex;
}

export function getWorkCardScrollTarget(container: HTMLElement, index: number) {
  const cards = getWorkCards(container);
  const card = cards[index];
  if (!card) return null;

  return getCardIdealScroll(container, card, index);
}

export function scrollWorkCarouselToIndex(
  container: HTMLElement,
  index: number,
  smooth = true,
) {
  const target = getWorkCardScrollTarget(container, index);
  if (target === null) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  container.scrollTo({
    left: target,
    behavior: smooth && !reducedMotion ? "smooth" : "auto",
  });
}

export function whenWorkCarouselScrollSettles(
  container: HTMLElement,
  onSettled: () => void,
) {
  const supportsScrollEnd = "onscrollend" in HTMLElement.prototype;

  if (supportsScrollEnd) {
    container.addEventListener("scrollend", onSettled, { once: true });
    return () => container.removeEventListener("scrollend", onSettled);
  }

  let timer = 0;

  const finish = () => {
    container.removeEventListener("scroll", onScroll);
    window.clearTimeout(timer);
    onSettled();
  };

  const onScroll = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(finish, 120);
  };

  container.addEventListener("scroll", onScroll, { passive: true });
  timer = window.setTimeout(finish, 800);

  return () => {
    container.removeEventListener("scroll", onScroll);
    window.clearTimeout(timer);
  };
}
