import {
  SHARED_TRANSITION_MS,
  findVisibleProjectCard,
  toRect,
  type ElementRect,
  type ModalTargets,
} from "@/lib/motion";

export const FLIP_CLOSE_MS = SHARED_TRANSITION_MS;
export const FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

export interface SharedElementFlip {
  el: HTMLElement;
  from: ElementRect;
  to: ElementRect;
  fromFontSize?: string;
  toFontSize?: string;
}

export function applyFlipIn({ el, from, to, fromFontSize }: SharedElementFlip) {
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const sx = to.width > 0 ? from.width / to.width : 1;
  const sy = to.height > 0 ? from.height / to.height : 1;

  el.classList.add("work-card-flip-active");
  el.style.transformOrigin = "top left";
  el.style.transition = "none";
  el.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

  if (fromFontSize) {
    el.style.fontSize = fromFontSize;
  }
}

export function playFlipOut({ el, toFontSize }: SharedElementFlip) {
  el.style.transition = `transform ${FLIP_CLOSE_MS}ms ${FLIP_EASING}, font-size ${FLIP_CLOSE_MS}ms ${FLIP_EASING}`;
  el.style.transform = "";

  if (toFontSize) {
    el.style.fontSize = toFontSize;
  }
}

export function cleanupFlip(el: HTMLElement) {
  el.classList.remove("work-card-flip-active");
  el.style.transform = "";
  el.style.transformOrigin = "";
  el.style.transition = "";
  el.style.fontSize = "";
}

export function getCardSharedElements(projectId: string) {
  const card = findVisibleProjectCard(projectId);
  if (!card) return null;

  const visual = card.querySelector<HTMLElement>(".work-card-visual");
  const title = card.querySelector<HTMLElement>(".work-card-title");
  const year = card.querySelector<HTMLElement>(".work-card-year");
  const tags = card.querySelector<HTMLElement>(".work-card-tags");

  if (!visual || !title || !year || !tags) return null;

  return { card, visual, title, year, tags };
}

function buildFlips(modalTargets: ModalTargets, shared: NonNullable<ReturnType<typeof getCardSharedElements>>) {
  const { visual, title, year, tags } = shared;

  return [
    {
      el: visual,
      from: modalTargets.thumbnail,
      to: toRect(visual.getBoundingClientRect()),
    },
    {
      el: title,
      from: modalTargets.title,
      to: toRect(title.getBoundingClientRect()),
      fromFontSize: modalTargets.titleFontSize,
      toFontSize: getComputedStyle(title).fontSize,
    },
    {
      el: year,
      from: modalTargets.year,
      to: toRect(year.getBoundingClientRect()),
      fromFontSize: modalTargets.yearFontSize,
      toFontSize: getComputedStyle(year).fontSize,
    },
    {
      el: tags,
      from: modalTargets.tags,
      to: toRect(tags.getBoundingClientRect()),
    },
  ] satisfies SharedElementFlip[];
}

export function runFlipClose({
  projectId,
  modalTargets,
  onComplete,
}: {
  projectId: string;
  modalTargets: ModalTargets;
  onComplete: () => void;
}) {
  const shared = getCardSharedElements(projectId);
  if (!shared) {
    onComplete();
    return () => {};
  }

  const flips = buildFlips(modalTargets, shared);
  const root = document.documentElement;
  const frozenCardHeight = shared.card.offsetHeight;
  shared.card.style.minHeight = `${frozenCardHeight}px`;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    flips.forEach((flip) => cleanupFlip(flip.el));
    shared.card.style.minHeight = "";
    shared.visual.removeEventListener("transitionend", onTransitionEnd);
    window.clearTimeout(timeout);
    // Do NOT remove is-closing-flip here — onComplete triggers setActiveProject(null)
    // which is a batched React update. Removing the class synchronously would make
    // the modal flash back visible before it unmounts. resetTransition defers the
    // removal to requestAnimationFrame so React commits the unmount first.
    onComplete();
  };

  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.propertyName !== "transform" || event.currentTarget !== shared.visual) return;
    finish();
  };

  root.classList.add("is-closing-flip");
  flips.forEach(applyFlipIn);

  const raf = requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      flips.forEach(playFlipOut);
    });
  });

  shared.visual.addEventListener("transitionend", onTransitionEnd);
  const timeout = window.setTimeout(finish, FLIP_CLOSE_MS + 100);

  return () => {
    cancelAnimationFrame(raf);
    finish();
  };
}
