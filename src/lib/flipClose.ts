import { SHARED_TRANSITION_MS, toRect, type ElementRect, type ModalTargets } from "@/lib/motion";

export const FLIP_CLOSE_MS = SHARED_TRANSITION_MS;
export const FLIP_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

const FLIP_FRAME_PROPS = ["top", "left", "width", "height"] as const;

export interface SharedElementFlip {
  el: HTMLElement;
  from: ElementRect;
  to: ElementRect;
  placeholder: HTMLDivElement;
  fromFontSize?: string;
  toFontSize?: string;
}

function createPlaceholder(rect: ElementRect) {
  const placeholder = document.createElement("div");
  placeholder.className = "work-card-flip-placeholder";
  placeholder.style.width = `${rect.width}px`;
  placeholder.style.height = `${rect.height}px`;
  placeholder.style.flexShrink = "0";
  placeholder.setAttribute("aria-hidden", "true");
  return placeholder;
}

export function applyFlipIn({ el, from, fromFontSize, placeholder }: SharedElementFlip) {
  el.parentNode?.insertBefore(placeholder, el);

  el.classList.add("work-card-flip-active");
  el.style.position = "fixed";
  el.style.top = `${from.top}px`;
  el.style.left = `${from.left}px`;
  el.style.width = `${from.width}px`;
  el.style.height = `${from.height}px`;
  el.style.margin = "0";
  el.style.transform = "none";
  el.style.transformOrigin = "";
  el.style.zIndex = "230";
  el.style.transition = "none";
  el.style.boxSizing = "border-box";

  if (fromFontSize) {
    el.style.fontSize = fromFontSize;
  }
}

export function playFlipOut({ el, to, toFontSize }: SharedElementFlip) {
  const transitions = FLIP_FRAME_PROPS.map(
    (prop) => `${prop} ${FLIP_CLOSE_MS}ms ${FLIP_EASING}`,
  );
  if (toFontSize) {
    transitions.push(`font-size ${FLIP_CLOSE_MS}ms ${FLIP_EASING}`);
    el.style.fontSize = toFontSize;
  }
  el.style.transition = transitions.join(", ");
  el.style.top = `${to.top}px`;
  el.style.left = `${to.left}px`;
  el.style.width = `${to.width}px`;
  el.style.height = `${to.height}px`;
}

export function cleanupFlip({ el, placeholder }: SharedElementFlip) {
  el.classList.remove("work-card-flip-active");
  el.style.position = "";
  el.style.top = "";
  el.style.left = "";
  el.style.width = "";
  el.style.height = "";
  el.style.margin = "";
  el.style.transform = "";
  el.style.transformOrigin = "";
  el.style.zIndex = "";
  el.style.transition = "";
  el.style.boxSizing = "";
  el.style.fontSize = "";
  placeholder.remove();
}

export function getCardSharedElements(projectId: string) {
  const card = document.querySelector<HTMLElement>(`[data-project-id="${projectId}"]`);
  if (!card) return null;

  const visual = card.querySelector<HTMLElement>(".work-card-visual");
  const title = card.querySelector<HTMLElement>(".work-card-title");
  const year = card.querySelector<HTMLElement>(".work-card-year");
  const tags = card.querySelector<HTMLElement>(".work-card-tags");
  const body = card.querySelector<HTMLElement>(".work-card-body");

  if (!visual || !title || !year || !tags || !body) return null;

  return { card, body, visual, title, year, tags };
}

function buildFlips(modalTargets: ModalTargets, shared: NonNullable<ReturnType<typeof getCardSharedElements>>) {
  const { visual, title, year, tags } = shared;

  const items = [
    { el: visual, from: modalTargets.thumbnail, to: toRect(visual.getBoundingClientRect()) },
    { el: title, from: modalTargets.title, to: toRect(title.getBoundingClientRect()) },
    { el: year, from: modalTargets.year, to: toRect(year.getBoundingClientRect()) },
    { el: tags, from: modalTargets.tags, to: toRect(tags.getBoundingClientRect()) },
  ];

  return items.map((item) => ({
    ...item,
    fromFontSize:
      item.el === title
        ? modalTargets.titleFontSize
        : item.el === year
          ? modalTargets.yearFontSize
          : undefined,
    toFontSize:
      item.el === title
        ? getComputedStyle(title).fontSize
        : item.el === year
          ? getComputedStyle(year).fontSize
          : undefined,
    placeholder: createPlaceholder(item.to),
  })) satisfies SharedElementFlip[];
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
  const frozenBodyHeight = shared.body.offsetHeight;
  shared.body.style.minHeight = `${frozenBodyHeight}px`;
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    flips.forEach((flip) => cleanupFlip(flip));
    shared.body.style.minHeight = "";
    root.classList.remove("is-closing-flip");
    shared.visual.removeEventListener("transitionend", onTransitionEnd);
    window.clearTimeout(timeout);
    onComplete();
  };

  const onTransitionEnd = (event: TransitionEvent) => {
    if (event.propertyName !== "width" || event.currentTarget !== shared.visual) return;
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
