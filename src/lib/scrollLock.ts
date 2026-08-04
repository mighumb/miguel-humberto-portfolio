let lockCount = 0;
let savedScrollX = 0;
let savedScrollY = 0;

export function getSavedScrollPosition() {
  return { x: savedScrollX, y: savedScrollY };
}

/** Keep the unlock target in sync when close FLIP nudges page scroll. */
export function updateSavedScrollPosition(x: number, y: number) {
  savedScrollX = Math.max(0, x);
  savedScrollY = Math.max(0, y);
}

export function snapScrollTo(x: number, y: number) {
  if (typeof window === "undefined") return;

  const html = document.documentElement;
  const body = document.body;
  const previousHtmlBehavior = html.style.scrollBehavior;
  const previousBodyBehavior = body.style.scrollBehavior;

  html.classList.add("scroll-snap");
  html.style.scrollBehavior = "auto";
  body.style.scrollBehavior = "auto";

  window.scrollTo(x, y);
  html.scrollLeft = x;
  html.scrollTop = y;
  body.scrollLeft = x;
  body.scrollTop = y;

  // Keep the restore synchronous. A deferred second pass used to run after the
  // close FLIP had already measured its destination, which shifted the home
  // page under the animation and read as a jump.
  html.style.scrollBehavior = previousHtmlBehavior;
  body.style.scrollBehavior = previousBodyBehavior;
  html.classList.remove("scroll-snap");
}

export function lockScroll() {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    savedScrollX = window.scrollX;
    savedScrollY = window.scrollY;

    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }

    const { style: bodyStyle } = document.body;
    const { style: htmlStyle } = document.documentElement;

    // scrollbar-gutter: stable on html permanently reserves the scrollbar
    // gutter, so no paddingRight compensation is needed — the gutter space
    // is constant whether the scrollbar is visible or not.
    htmlStyle.overflow = "hidden";
    bodyStyle.overflow = "hidden";
    htmlStyle.overscrollBehavior = "none";
    document.documentElement.classList.add("modal-open");
  }

  lockCount += 1;
}

export function unlockScroll() {
  if (typeof document === "undefined" || lockCount === 0) return;

  lockCount -= 1;
  if (lockCount > 0) return;

  const { x, y } = getSavedScrollPosition();

  const { style: bodyStyle } = document.body;
  const { style: htmlStyle } = document.documentElement;

  htmlStyle.overflow = "";
  bodyStyle.overflow = "";
  htmlStyle.overscrollBehavior = "";
  document.documentElement.classList.remove("modal-open");

  snapScrollTo(x, y);
}
