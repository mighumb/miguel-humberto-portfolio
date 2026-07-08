let lockCount = 0;
let savedScrollX = 0;
let savedScrollY = 0;

function restoreScrollPosition() {
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = "auto";
  window.scrollTo(savedScrollX, savedScrollY);
  root.style.scrollBehavior = previousBehavior;
}

export function lockScroll() {
  if (typeof document === "undefined") return;

  if (lockCount === 0) {
    savedScrollX = window.scrollX;
    savedScrollY = window.scrollY;
    const { style: bodyStyle } = document.body;
    const { style: htmlStyle } = document.documentElement;

    bodyStyle.position = "fixed";
    bodyStyle.top = `-${savedScrollY}px`;
    bodyStyle.left = "0";
    bodyStyle.right = "0";
    bodyStyle.width = "100%";
    bodyStyle.overflow = "hidden";
    htmlStyle.overflow = "hidden";
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

  bodyStyle.position = "";
  bodyStyle.top = "";
  bodyStyle.left = "";
  bodyStyle.right = "";
  bodyStyle.width = "";
  bodyStyle.overflow = "";
  htmlStyle.overflow = "";
  document.documentElement.classList.remove("modal-open");

  restoreScrollPosition();
}
