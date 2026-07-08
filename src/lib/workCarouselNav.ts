function getWorkCards(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-project-id]"));
}

function getFocusInset(container: HTMLElement) {
  const gutter = container.firstElementChild as HTMLElement | null;
  return gutter?.offsetWidth ?? 24;
}

export function getFocusedWorkCardIndex(container: HTMLElement) {
  const cards = getWorkCards(container);
  if (!cards.length) return 0;

  const focusInset = getFocusInset(container);
  const scrollLeft = container.scrollLeft;

  let bestIndex = 0;
  let bestDistance = Infinity;

  cards.forEach((card, index) => {
    const idealScroll = card.offsetLeft - focusInset;
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

  return card.offsetLeft - getFocusInset(container);
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
