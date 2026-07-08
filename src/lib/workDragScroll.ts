const DRAG_THRESHOLD_PX = 8;
const DRAG_SUPPRESS_MS = 400;

export function attachWorkDragScroll(container: HTMLElement) {
  let activePointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let dragged = false;
  let suppressClickTimer = 0;

  const clearDraggedFlag = () => {
    delete container.dataset.workDragged;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!dragged) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

      dragged = true;
      container.classList.add("is-dragging");
      container.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    container.scrollLeft = startScrollLeft - deltaX;
  };

  const endDrag = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);

    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }

    container.classList.remove("is-dragging");
    activePointerId = null;

    if (dragged) {
      container.dataset.workDragged = "true";
      window.clearTimeout(suppressClickTimer);
      suppressClickTimer = window.setTimeout(clearDraggedFlag, DRAG_SUPPRESS_MS);
    }

    dragged = false;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;

    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = container.scrollLeft;
    dragged = false;

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
  };

  const onClickCapture = (event: MouseEvent) => {
    if (container.dataset.workDragged !== "true") return;
    event.preventDefault();
    event.stopPropagation();
    clearDraggedFlag();
  };

  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("click", onClickCapture, true);

  return () => {
    window.clearTimeout(suppressClickTimer);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
    container.classList.remove("is-dragging");
    clearDraggedFlag();
    container.removeEventListener("pointerdown", onPointerDown);
    container.removeEventListener("click", onClickCapture, true);
  };
}

export function shouldIgnoreWorkCardClick(target: EventTarget | null) {
  const element = target instanceof HTMLElement ? target : null;
  const scroll = element?.closest<HTMLElement>(".work-scroll");
  return scroll?.dataset.workDragged === "true";
}
