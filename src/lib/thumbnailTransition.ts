export interface ThumbnailRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function toThumbnailRect(rect: DOMRect): ThumbnailRect {
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  };
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
