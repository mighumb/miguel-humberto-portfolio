const DRAG_THRESHOLD_PX = 6;
const DRAG_SUPPRESS_MS = 400;

export function attachWorkDragScroll(container: HTMLElement) {
  let activePointerId: number | null = null;
  let startX = 0;
  let startScrollLeft = 0;
  let dragged = false;
  let suppressClickTimer = 0;

  const clearDraggedFlag = () => {
    delete container.dataset.workDragged;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;

    activePointerId = event.pointerId;
    startX = event.clientX;
    startScrollLeft = container.scrollLeft;
    dragged = false;
    container.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    const deltaX = event.clientX - startX;
    if (!dragged && Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

    if (!dragged) {
      dragged = true;
      container.classList.add("is-dragging");
    }

    event.preventDefault();
    container.scrollLeft = startScrollLeft - deltaX;
  };

  const endDrag = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    container.releasePointerCapture(event.pointerId);
    container.classList.remove("is-dragging");
    activePointerId = null;

    if (dragged) {
      container.dataset.workDragged = "true";
      window.clearTimeout(suppressClickTimer);
      suppressClickTimer = window.setTimeout(clearDraggedFlag, DRAG_SUPPRESS_MS);
    }

    dragged = false;
  };

  const onClickCapture = (event: MouseEvent) => {
    if (container.dataset.workDragged !== "true") return;
    event.preventDefault();
    event.stopPropagation();
    clearDraggedFlag();
  };

  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("pointerup", endDrag);
  container.addEventListener("pointercancel", endDrag);
  container.addEventListener("click", onClickCapture, true);

  return () => {
    window.clearTimeout(suppressClickTimer);
    container.classList.remove("is-dragging");
    clearDraggedFlag();
    container.removeEventListener("pointerdown", onPointerDown);
    container.removeEventListener("pointermove", onPointerMove);
    container.removeEventListener("pointerup", endDrag);
    container.removeEventListener("pointercancel", endDrag);
    container.removeEventListener("click", onClickCapture, true);
  };
}

export function shouldIgnoreWorkCardClick(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  const scroll = element?.closest<HTMLElement>(".work-scroll");
  return scroll?.dataset.workDragged === "true";
}
