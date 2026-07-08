let lockCount = 0;

export function lockScroll() {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const { style: bodyStyle } = document.body;
    const { style: htmlStyle } = document.documentElement;

    if (scrollbarWidth > 0) {
      bodyStyle.paddingRight = `${scrollbarWidth}px`;
    }

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

  const { style: bodyStyle } = document.body;
  const { style: htmlStyle } = document.documentElement;

  bodyStyle.paddingRight = "";
  htmlStyle.overflow = "";
  bodyStyle.overflow = "";
  htmlStyle.overscrollBehavior = "";
  document.documentElement.classList.remove("modal-open");
}
