export interface ElementRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface CardOrigin {
  thumbnail: ElementRect;
  title: ElementRect;
  titleFontSize: string;
  showVideo: boolean;
}

export interface ModalTargets {
  thumbnail: ElementRect;
  title: ElementRect;
  titleFontSize: string;
}

export interface FlightPair {
  thumbnail: { from: ElementRect; to: ElementRect };
  title: { from: ElementRect; to: ElementRect; fromFontSize: string; toFontSize: string };
  direction: "open" | "close";
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function toRect(domRect: DOMRect): ElementRect {
  return {
    top: domRect.top,
    left: domRect.left,
    width: domRect.width,
    height: domRect.height,
  };
}

export const SHARED_TRANSITION_MS = 560;
