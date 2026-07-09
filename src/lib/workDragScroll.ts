const DRAG_THRESHOLD_PX = 8;
const DRAG_SUPPRESS_MS = 400;
const VELOCITY_SAMPLE_MS = 120;
const MOMENTUM_THROW_FACTOR = 1.4;
const MOMENTUM_FRICTION = 0.92;
const MOMENTUM_MIN_VELOCITY = 0.015;

type VelocitySample = { x: number; t: number };

const motionControllers = new WeakMap<HTMLElement, () => void>();

export function stopWorkCarouselMotion(container: HTMLElement) {
  motionControllers.get(container)?.();
}

export function attachWorkDragScroll(container: HTMLElement) {
  let activePointerId: number | null = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let dragged = false;
  let suppressClickTimer = 0;
  let samples: VelocitySample[] = [];
  let momentumRaf = 0;
  let scrollVelocity = 0;
  let momentumLastTime = 0;

  const clearDraggedFlag = () => {
    delete container.dataset.workDragged;
  };

  const maxScrollLeft = () => Math.max(0, container.scrollWidth - container.clientWidth);

  const clampScroll = (value: number) => Math.max(0, Math.min(maxScrollLeft(), value));

  const stopMomentum = () => {
    if (momentumRaf) {
      cancelAnimationFrame(momentumRaf);
      momentumRaf = 0;
    }
    scrollVelocity = 0;
    momentumLastTime = 0;
  };

  const recordSample = (x: number) => {
    const now = performance.now();
    samples.push({ x, t: now });
    const cutoff = now - VELOCITY_SAMPLE_MS;
    while (samples.length > 2 && samples[0].t < cutoff) {
      samples.shift();
    }
  };

  const computeReleaseVelocity = () => {
    const now = performance.now();
    const recent = samples.filter((sample) => now - sample.t <= VELOCITY_SAMPLE_MS);
    if (recent.length < 2) return 0;

    const first = recent[0];
    const last = recent[recent.length - 1];
    const dt = last.t - first.t;
    if (dt <= 0) return 0;

    return (last.x - first.x) / dt;
  };

  const runMomentum = (now: number) => {
    if (!momentumLastTime) {
      momentumLastTime = now;
      momentumRaf = requestAnimationFrame(runMomentum);
      return;
    }

    const dt = Math.min(32, now - momentumLastTime);
    momentumLastTime = now;

    const delta = scrollVelocity * dt;
    const nextScroll = clampScroll(container.scrollLeft + delta);
    if (nextScroll === container.scrollLeft && Math.abs(delta) > 0.5) {
      scrollVelocity = 0;
    } else {
      container.scrollLeft = nextScroll;
      scrollVelocity *= Math.pow(MOMENTUM_FRICTION, dt / 16);
    }

    if (Math.abs(scrollVelocity) > MOMENTUM_MIN_VELOCITY) {
      momentumRaf = requestAnimationFrame(runMomentum);
      return;
    }

    stopMomentum();
  };

  const startMomentum = (clientVelocityPxPerMs: number) => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollVelocityPxPerMs = -clientVelocityPxPerMs * MOMENTUM_THROW_FACTOR;

    if (reducedMotion || Math.abs(scrollVelocityPxPerMs) < MOMENTUM_MIN_VELOCITY) return;

    stopMomentum();
    scrollVelocity = scrollVelocityPxPerMs;
    momentumRaf = requestAnimationFrame(runMomentum);
  };

  const clearDragCursor = () => {
    container.classList.remove("is-pressing", "is-dragging");
    document.body.style.removeProperty("cursor");
  };

  const onPointerMove = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    recordSample(event.clientX);

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!dragged) {
      if (Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) return;

      dragged = true;
      container.classList.remove("is-pressing");
      container.classList.add("is-dragging");
      document.body.style.cursor = "grabbing";
      container.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    container.scrollLeft = clampScroll(startScrollLeft - deltaX);
  };

  const endDrag = (event: PointerEvent) => {
    if (activePointerId !== event.pointerId) return;

    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);

    if (container.hasPointerCapture(event.pointerId)) {
      container.releasePointerCapture(event.pointerId);
    }

    clearDragCursor();

    if (dragged) {
      startMomentum(computeReleaseVelocity());
      container.dataset.workDragged = "true";
      window.clearTimeout(suppressClickTimer);
      suppressClickTimer = window.setTimeout(clearDraggedFlag, DRAG_SUPPRESS_MS);
    }

    activePointerId = null;
    dragged = false;
    samples = [];
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return;

    stopMomentum();
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = container.scrollLeft;
    dragged = false;
    samples = [];
    recordSample(event.clientX);

    container.classList.add("is-pressing");
    document.body.style.cursor = "grab";

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

  motionControllers.set(container, stopMomentum);

  container.addEventListener("pointerdown", onPointerDown);
  container.addEventListener("click", onClickCapture, true);

  return () => {
    motionControllers.delete(container);
    window.clearTimeout(suppressClickTimer);
    stopMomentum();
    clearDragCursor();
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
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
