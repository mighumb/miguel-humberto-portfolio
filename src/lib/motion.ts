import {
  type CardPerspective,
  computeCardFocus,
} from "@/lib/workCardFocus";

export type { CardPerspective };

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
  year: ElementRect;
  yearFontSize: string;
  tags: ElementRect;
  perspective: CardPerspective;
  showVideo: boolean;
  videoTime: number;
  videoPoster?: string;
}

export interface ModalTargets {
  thumbnail: ElementRect;
  title: ElementRect;
  titleFontSize: string;
  year: ElementRect;
  yearFontSize: string;
  tags: ElementRect;
}

export interface FlightTitlePair {
  from: ElementRect;
  to: ElementRect;
  fromFontSize: string;
  toFontSize: string;
}

export interface FlightRectPair {
  from: ElementRect;
  to: ElementRect;
}

export interface FlightPair {
  thumbnail: FlightRectPair;
  title: FlightTitlePair;
  year: FlightTitlePair;
  tags: FlightRectPair;
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

export function measureCardOrigin(projectId: string, showVideo = false): CardOrigin | null {
  const card = document.querySelector<HTMLElement>(`[data-project-id="${projectId}"]`);
  const visual = card?.querySelector<HTMLElement>(".work-card-visual");
  const title = card?.querySelector<HTMLElement>(".work-card-title");
  const year = card?.querySelector<HTMLElement>(".work-card-year");
  const tags = card?.querySelector<HTMLElement>(".work-card-tags");
  const container = card?.closest<HTMLElement>(".work-scroll");
  if (!card || !visual || !title || !year || !tags || !container) return null;

  const video = card.querySelector<HTMLVideoElement>(".work-card-media video");

  let videoPoster: string | undefined;
  if (showVideo && video && video.videoWidth > 0 && video.videoHeight > 0) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")?.drawImage(video, 0, 0);
      videoPoster = canvas.toDataURL("image/jpeg", 0.8);
    } catch {
      // cross-origin or tainted canvas — skip poster capture
    }
  }

  return {
    thumbnail: toRect(visual.getBoundingClientRect()),
    title: toRect(title.getBoundingClientRect()),
    titleFontSize: getComputedStyle(title).fontSize,
    year: toRect(year.getBoundingClientRect()),
    yearFontSize: getComputedStyle(year).fontSize,
    tags: toRect(tags.getBoundingClientRect()),
    perspective: computeCardFocus(card, container),
    showVideo,
    videoTime: showVideo && video ? video.currentTime : 0,
    videoPoster,
  };
}

export function invertFlight(flight: FlightPair): FlightPair {
  return {
    direction: "close",
    thumbnail: { from: flight.thumbnail.to, to: flight.thumbnail.from },
    title: {
      from: flight.title.to,
      to: flight.title.from,
      fromFontSize: flight.title.toFontSize,
      toFontSize: flight.title.fromFontSize,
    },
    year: {
      from: flight.year.to,
      to: flight.year.from,
      fromFontSize: flight.year.toFontSize,
      toFontSize: flight.year.fromFontSize,
    },
    tags: { from: flight.tags.to, to: flight.tags.from },
  };
}

export function buildCloseFlight(
  modalTargets: ModalTargets,
  cardOrigin: CardOrigin,
): FlightPair {
  return {
    direction: "close",
    thumbnail: { from: modalTargets.thumbnail, to: cardOrigin.thumbnail },
    title: {
      from: modalTargets.title,
      to: cardOrigin.title,
      fromFontSize: modalTargets.titleFontSize,
      toFontSize: cardOrigin.titleFontSize,
    },
    year: {
      from: modalTargets.year,
      to: cardOrigin.year,
      fromFontSize: modalTargets.yearFontSize,
      toFontSize: cardOrigin.yearFontSize,
    },
    tags: { from: modalTargets.tags, to: cardOrigin.tags },
  };
}

export const SHARED_TRANSITION_MS = 560;
