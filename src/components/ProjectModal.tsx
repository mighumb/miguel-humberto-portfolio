"use client";

import { useEffect, useCallback, useRef, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/contexts/LocaleContext";
import { useScrollLock } from "@/hooks/useScrollLock";
import { translations } from "@/lib/i18n";
import { toRect, type ModalTargets } from "@/lib/motion";
import { type Project, type Deliverable, projectAssetBase, projectCoverUrl } from "@/lib/projects";
import { syncVideoPlayback } from "@/lib/videoHandoff";

interface ProjectModalProps {
  project: Project;
  onRequestClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  total: number;
  sharedContentVisible: boolean;
  awaitingFlightTargets: boolean;
  backdropVisible: boolean;
  videoPlaying: boolean;
  videoTime: number;
  /** Frame captured from the card at click time; covers the hero video while
   *  it seeks to the handoff position, which would otherwise render black. */
  videoPoster?: string;
  onFlightTargetsReady: (targets: ModalTargets) => void;
  onRegisterMeasure: (fn: (() => ModalTargets | null) | null) => void;
}

function youtubeEmbedUrl(watchUrl: string): string | null {
  try {
    const vid = new URL(watchUrl).searchParams.get("v");
    return vid ? `https://www.youtube.com/embed/${vid}` : null;
  } catch {
    return null;
  }
}

function ResourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-sm font-medium text-text-primary transition-colors hover:text-accent"
    >
      {children}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
        <path
          d="M3.5 10.5 10.5 3.5M5.5 3.5h5v5"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

/** Renders plain text with optional markdown links: [label](https://…). */
function LinkedText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = linkRe.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={key++}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-text-primary underline underline-offset-2 transition-colors hover:text-accent"
      >
        {match[1]}
      </a>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
}

// Number of cards visibly stacked; deeper cards are not rendered
const VISIBLE_CARDS = 6;
// Full flight duration for a card leaving/entering the front slot
const FLIGHT_MS = 680;
// Act 1 of the "next" flight (slide out below the pile); act 2 is the remainder
const PHASE1_MS = 320;
// Easing shared by every card shifting one slot — the pile moves as one object
const PILE_EASE = "cubic-bezier(0.45, 0.05, 0.2, 1)";
// Real 3D depth between pile slots. Cards live in ONE shared perspective space
// (preserve-3d on the wrapper): occlusion is resolved per-fragment by depth,
// so a card in flight is covered progressively as it slides between layers —
// never the all-at-once pop a z-index flip produces.
const Z_STEP = 30;
const PERSPECTIVE = 1600;

// Vertical peek of each slot below slot 0 — tight steps, compressing further
// toward the back like a squared-up deck of cards.
function slotOffsetY(slot: number): number {
  let y = 0;
  for (let i = 1; i <= slot; i++) y += Math.max(3, 12 - (i - 1) * 2);
  return y;
}

// deepest caps the Y/tilt so slots beyond the visible range park exactly
// behind the deepest visible card (only their Z keeps growing).
function slotTransform(slot: number, deepest: number): string {
  const v = Math.min(slot, deepest);
  const y = slotOffsetY(v);
  const rot = Math.min(8, v * 1.2);
  return `translate3d(0, ${y}px, ${-Z_STEP * slot}px) rotateX(${rot}deg)`;
}

function slotShadow(slot: number): string {
  if (slot === 0) return "0 24px 64px -12px rgba(0,0,0,0.28), 0 8px 24px -4px rgba(0,0,0,0.12)";
  if (slot === 1) return "0 16px 40px -6px rgba(0,0,0,0.22), 0 4px 12px -2px rgba(0,0,0,0.12)";
  return "0 10px 24px -4px rgba(0,0,0,0.14)";
}

interface FlightState {
  imgIndex: number;
  dir: "next" | "prev";
  // next: 1 = slide out below (in front), 2 = tuck deep into the stack.
  // prev: 0 = parked deep (mount frame, no transition), 1 = slide out below
  //       (still deep), 2 = swing toward the viewer while below the pile,
  //       3 = sweep up onto the front slot.
  phase: 0 | 1 | 2 | 3;
}

function ProcessStackedCards({ images, assetBase }: { images: string[]; assetBase: string }) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const [flight, setFlight] = useState<FlightState | null>(null);
  // Pointer is over the pile (fine-pointer devices only) — lifts the front card
  const [hovered, setHovered] = useState(false);
  const isNavigatingRef = useRef(false);
  const total = images.length;

  // Deepest VISIBLE slot; deeper cards are not rendered at all
  const deepestVisible = Math.min(total, VISIBLE_CARDS) - 1;
  const maxY = slotOffsetY(deepestVisible);
  // The flight dips past the pile's bottom edge before changing depth
  const dipY = maxY + 40;
  const padBottom = dipY + 12;

  const navigate = useCallback((dir: "next" | "prev") => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    setDisplayIndex((current) => {
      const newIndex = dir === "next" ? (current + 1) % total : (current - 1 + total) % total;
      // next: the OLD front card flies under the pile.
      // prev: the card coming from the BACK flies out and lands on top. It
      // mounts this render, so it starts at phase 0 (parked deep, no
      // transition) and only moves on the next frame.
      setFlight({
        imgIndex: dir === "next" ? current : newIndex,
        dir,
        phase: dir === "next" ? 1 : 0,
      });
      return newIndex;
    });
    if (dir === "next") {
      setTimeout(() => setFlight((f) => (f ? { ...f, phase: 2 } : f)), PHASE1_MS);
    } else {
      // Double rAF: guarantee the parked phase-0 position is painted before
      // the phase-1 transition target is set.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFlight((f) => (f ? { ...f, phase: 1 } : f)));
      });
      setTimeout(() => setFlight((f) => (f ? { ...f, phase: 2 } : f)), 300);
      setTimeout(() => setFlight((f) => (f ? { ...f, phase: 3 } : f)), 440);
    }
    setTimeout(() => {
      setFlight(null);
      isNavigatingRef.current = false;
    }, FLIGHT_MS);
  }, [total]);

  const goNext = useCallback(() => navigate("next"), [navigate]);
  const goPrev = useCallback(() => navigate("prev"), [navigate]);

  const handlePileEnter = () => {
    // Lift affordance only on fine-pointer devices (touch would get a stuck hover)
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      setHovered(true);
    }
  };

  return (
    <>
      <div>
        {/* Stack wrapper — ONE shared 3D space (perspective + preserve-3d).
            Card stacking comes from translateZ depth, resolved per-fragment by
            the compositor: a card in flight is occluded progressively as it
            passes between layers — no z-index, no binary front/back pop.
            Only cards within the visible depth are mounted, plus the card in
            flight and the one leaving the back range (kept for their exits). */}
        <div
          className="relative w-full"
          style={{
            paddingBottom: `${padBottom}px`,
            perspective: `${PERSPECTIVE}px`,
            // Anchor the vanishing point at the pile's base: depth shrink pulls
            // card tops up-and-in while bottom edges stay put, so the visible
            // peek of each slot matches slotOffsetY regardless of card height.
            perspectiveOrigin: "50% 100%",
            transformStyle: "preserve-3d",
          }}
          onMouseEnter={handlePileEnter}
          onMouseLeave={() => setHovered(false)}
        >
          {images.map((file, imgIndex) => {
            const slot = (imgIndex - displayIndex + total) % total;
            const isFront = slot === 0;
            const fly = flight && flight.imgIndex === imgIndex ? flight : null;
            // During a flight, the card sliding beyond the visible range stays
            // mounted just long enough to fade out behind the deepest card.
            const isLeavingDepth = !fly && flight !== null && slot === deepestVisible + 1;
            // During a "next" flight the flying card's edge is still visible
            // below the pile; mounting the newly entering back card at the same
            // time would show a 7th edge. It mounts (with its fade-in) only
            // once the flight is over and the flying edge is gone.
            const isEnteringDepth =
              !fly && flight !== null && flight.dir === "next" && slot === deepestVisible;

            if (isEnteringDepth) return null;
            if (slot > deepestVisible && !fly && !isLeavingDepth) return null;

            // Parked position: exactly behind the deepest visible card, one
            // Z-step deeper — geometrically fully covered by it.
            const parked = slotTransform(deepestVisible + 1, deepestVisible);

            let transform = slotTransform(slot, deepestVisible);
            let opacity = isLeavingDepth ? 0 : 1;
            // Shadows are NOT transitioned: animating box-shadow forces a repaint
            // every frame. Transform + opacity stay fully GPU-composited.
            const boxShadow = slotShadow(Math.min(slot, deepestVisible));
            let transition = `transform ${FLIGHT_MS}ms ${PILE_EASE}, opacity 400ms ease`;

            if (fly) {
              if (fly.dir === "next") {
                if (fly.phase === 1) {
                  // Slide out below the pile, floating slightly toward the viewer
                  transform = `translate3d(0, ${dipY}px, ${Z_STEP}px) rotateX(-14deg)`;
                  transition = `transform ${PHASE1_MS}ms cubic-bezier(0.4, 0, 0.7, 1)`;
                } else {
                  // Tuck: Y rises back to the pile while Z sinks through every
                  // layer — the card visibly slides in between the stack's
                  // edges, deeper and deeper, until it parks at the very back.
                  transform = parked;
                  transition = `transform ${FLIGHT_MS - PHASE1_MS}ms cubic-bezier(0.16, 0.3, 0.24, 1)`;
                }
              } else {
                if (fly.phase === 0) {
                  // Mount frame: parked deep, painted before any motion starts
                  transform = parked;
                  transition = "none";
                } else if (fly.phase === 1) {
                  // Slide out below the pile, still at full depth (it emerges
                  // small and from underneath, like pulling the bottom card)
                  transform = `translate3d(0, ${dipY}px, ${-Z_STEP * (deepestVisible + 1)}px) rotateX(-6deg)`;
                  transition = "transform 300ms cubic-bezier(0.4, 0, 0.7, 1)";
                } else if (fly.phase === 2) {
                  // Below the pile (no overlap): swing toward the viewer
                  transform = `translate3d(0, ${dipY + 4}px, ${Z_STEP}px) rotateX(-10deg)`;
                  transition = "transform 140ms linear";
                } else {
                  // Sweep up over the pile onto the front slot
                  transform = slotTransform(0, deepestVisible);
                  transition = "transform 240ms cubic-bezier(0.16, 0.3, 0.24, 1)";
                }
              }
            } else if (isFront && hovered) {
              // Desktop hover: the front card lifts, inviting the click
              transform = "translate3d(0, -10px, 0)";
              transition = "transform 280ms cubic-bezier(0.22, 1, 0.36, 1)";
            }

            const style: React.CSSProperties = {
              transform,
              opacity,
              boxShadow,
              transition,
              background: "var(--bg-secondary)",
              ...(isFront
                ? { cursor: "pointer" }
                : { position: "absolute" as const, top: 0, bottom: padBottom, left: 0, right: 0 }),
            };

            return (
              <div
                key={imgIndex}
                className={`process-pile-card process-pile-card-mount overflow-hidden rounded-2xl${
                  isFront ? " relative aspect-video w-full" : ""
                }`}
                style={style}
                onClick={isFront ? goNext : undefined}
                role={isFront ? "button" : undefined}
                aria-label={isFront ? "Image suivante" : undefined}
              >
                {/* object-contain: images are never cropped — full screenshot visible */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${assetBase}/${file}`} alt="" className="h-full w-full object-contain" loading="lazy" />
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <span className="tabular-nums text-xs text-text-secondary">
            {String(displayIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-bg-secondary text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              aria-label="Image précédente"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-bg-secondary text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              aria-label="Image suivante"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function DeliverableVideo({ src }: { src: string }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPause = () => setPlaying(false);
    video.addEventListener("pause", onPause);
    return () => video.removeEventListener("pause", onPause);
  }, []);

  const handlePlay = () => {
    setPlaying(true);
    videoRef.current?.play().catch(() => {});
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-bg-secondary">
      <video
        ref={videoRef}
        // #t=0.1 forces iOS Safari to seek and decode a frame at rest; without
        // it, preload="metadata" leaves the video black until playback starts
        // there (desktop browsers already paint the first frame on their own).
        src={`${src}#t=0.1`}
        controls={playing}
        muted
        loop
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
      {!playing && (
        <button
          type="button"
          onClick={handlePlay}
          className="absolute inset-0 cursor-pointer border-0 bg-transparent"
          aria-label="Play video"
        >
          <span
            className="absolute inset-0 bg-bg-primary/25 transition-colors group-hover:bg-bg-primary/15"
            aria-hidden
          />
          <span
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-bg-primary/70 text-text-primary backdrop-blur-sm transition-transform group-hover:scale-105 md:h-16 md:w-16"
            aria-hidden
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
              <path d="M8 5.14v13.72L19 12 8 5.14z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}

export default function ProjectModal({
  project,
  onRequestClose,
  onPrev,
  onNext,
  currentIndex,
  total,
  sharedContentVisible,
  awaitingFlightTargets,
  backdropVisible,
  videoPlaying,
  videoTime,
  videoPoster,
  onFlightTargetsReady,
  onRegisterMeasure,
}: ProjectModalProps) {
  const { locale } = useLocale();
  const mt = translations[locale].modal;
  const coverUrl = projectCoverUrl(project);
  const modalRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const tagsRef = useRef<HTMLDivElement>(null);
  const heroVideoRef = useRef<HTMLVideoElement>(null);
  // The captured card frame stays layered over the hero video until the video
  // has actually PRESENTED a frame after the reveal. The `poster` attribute is
  // not enough: an autoplaying video that is still seeking/decoding at reveal
  // time paints black on mobile Safari, poster or not.
  const [heroPosterVisible, setHeroPosterVisible] = useState(
    () => videoPlaying && !!videoPoster,
  );

  useScrollLock(true);

  useLayoutEffect(() => {
    const video = heroVideoRef.current;
    if (!video || !project.hasVideo || !videoPlaying) return;
    syncVideoPlayback(video, videoTime);
  }, [project.id, project.hasVideo, videoPlaying, videoTime]);

  useEffect(() => {
    // Once the modal content is revealed, drop the poster overlay as soon as
    // the video PRESENTS a frame (rVFC when available). Deliberately no
    // timeout: on a slow mobile connection the video can take seconds to
    // buffer, and force-dropping the overlay would reveal a black element.
    // If playback never starts, keeping the frozen frame is strictly better
    // than black.
    if (!heroPosterVisible || !sharedContentVisible) return;
    const video = heroVideoRef.current;
    if (!video) {
      setHeroPosterVisible(false);
      return;
    }
    let cancelled = false;
    const clear = () => {
      if (!cancelled) setHeroPosterVisible(false);
    };
    const rvfcVideo = video as HTMLVideoElement & {
      requestVideoFrameCallback?: (cb: () => void) => number;
    };
    if (typeof rvfcVideo.requestVideoFrameCallback === "function") {
      rvfcVideo.requestVideoFrameCallback(clear);
    } else {
      video.addEventListener("timeupdate", clear, { once: true });
    }
    return () => {
      cancelled = true;
      video.removeEventListener("timeupdate", clear);
    };
  }, [heroPosterVisible, sharedContentVisible]);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || !project.hasVideo || !project.videoUrl) return;
    if (sharedContentVisible) {
      // Also runs in the flight-handoff case (videoPlaying): iOS can reject
      // the play() issued while the modal was still hidden, and nothing else
      // would retry it. play() on an already-playing video is a no-op.
      video.play().catch(() => {});
    }
  }, [sharedContentVisible, project.hasVideo, project.videoUrl, project.id, videoPlaying]);


  const measureTargets = useCallback((): ModalTargets | null => {
    const modal = modalRef.current;
    const hero = heroRef.current;
    const title = titleRef.current;
    const year = yearRef.current;
    const tags = tagsRef.current;
    if (!hero || !title || !year || !tags) return null;

    // Snap to top so the hero is at its natural viewport position for the FLIP.
    // The caller (requestClose) hides the modal before calling this, so the
    // scroll reset is never painted as a visible frame.
    if (modal && modal.scrollTop !== 0) {
      modal.scrollTop = 0;
    }

    return {
      thumbnail: toRect(hero.getBoundingClientRect()),
      title: toRect(title.getBoundingClientRect()),
      titleFontSize: getComputedStyle(title).fontSize,
      year: toRect(year.getBoundingClientRect()),
      yearFontSize: getComputedStyle(year).fontSize,
      tags: toRect(tags.getBoundingClientRect()),
    };
  }, []);

  useLayoutEffect(() => {
    onRegisterMeasure(measureTargets);
    return () => onRegisterMeasure(null);
  }, [measureTargets, onRegisterMeasure]);

  useLayoutEffect(() => {
    modalRef.current?.scrollTo({ top: 0, left: 0 });

    if (!awaitingFlightTargets) return;

    const targets = measureTargets();
    if (targets) onFlightTargetsReady(targets);
  }, [awaitingFlightTargets, measureTargets, onFlightTargetsReady, project.id]);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const blockBackgroundScroll = (event: WheelEvent | TouchEvent) => {
      if (!modal.contains(event.target as Node)) {
        event.preventDefault();
      }
    };

    window.addEventListener("wheel", blockBackgroundScroll, { passive: false });
    window.addEventListener("touchmove", blockBackgroundScroll, { passive: false });

    return () => {
      window.removeEventListener("wheel", blockBackgroundScroll);
      window.removeEventListener("touchmove", blockBackgroundScroll);
    };
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onRequestClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onRequestClose, onPrev, onNext],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (typeof document === "undefined") return null;

  const sharedHidden = !sharedContentVisible;

  return createPortal(
    <div
      className="project-modal fixed inset-0 z-[200]"
      role="dialog"
      aria-modal="true"
      aria-label={project.title[locale]}
    >
      <div
        className={`project-modal-backdrop fixed inset-0 ${backdropVisible ? "is-visible" : ""}`}
        aria-hidden
      />

      <div
        ref={modalRef}
        className="project-modal-scroll relative z-[1] h-full overflow-y-auto overscroll-contain"
      >
        <div
          className={`project-modal-body ${sharedContentVisible ? "is-visible" : ""}`}
        >
          <div
            className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 md:px-10"
            style={{ background: "linear-gradient(to bottom, var(--header-bg-subtle) 0%, transparent 100%)" }}
          >
            <span className="text-xs tracking-widest text-text-secondary uppercase">
              {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPrev}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary"
                aria-label="Previous project"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onNext}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary"
                aria-label="Next project"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M7 3l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                onClick={onRequestClose}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-6 pb-24 md:px-10">
            <div className="pt-8 md:pt-12">
              <div
                ref={heroRef}
                className={`project-modal-hero relative aspect-video w-full overflow-hidden rounded-xl ${
                  coverUrl || (project.hasVideo && project.videoUrl)
                    ? "bg-bg-secondary"
                    : "project-placeholder-gradient"
                } ${sharedHidden ? "is-shared-hidden" : ""}`}
              >
                {project.hasVideo && project.videoUrl ? (
                  <>
                    <video
                      ref={heroVideoRef}
                      src={project.videoUrl}
                      // The flight hands off by seeking this video to the card's
                      // playback position the instant it is revealed. A seeking
                      // video has no frame to paint, so without a poster it
                      // renders black for a beat — the flash at the end of the
                      // card→modal transition.
                      poster={videoPoster}
                      controls={sharedContentVisible}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload={videoPlaying ? "auto" : "metadata"}
                      className="h-full w-full object-cover"
                    />
                    {heroPosterVisible && videoPoster && (
                      // Stays on top of the video until it presents a frame
                      // after the reveal (see the heroPosterVisible effect).
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={videoPoster}
                        alt=""
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                        aria-hidden
                      />
                    )}
                  </>
                ) : coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl font-light text-text-secondary opacity-30 md:text-5xl">
                      {project.id}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <div className="flex items-baseline justify-between gap-4">
                  <h2
                    ref={titleRef}
                    className={`project-modal-title text-2xl font-medium tracking-tight text-text-primary md:text-4xl ${
                      sharedHidden ? "is-shared-hidden" : ""
                    }`}
                  >
                    {project.title[locale]}
                  </h2>
                  <span
                    ref={yearRef}
                    className={`work-modal-year shrink-0 text-xs text-text-secondary md:text-sm ${
                      sharedHidden ? "is-shared-hidden" : ""
                    }`}
                  >
                    {project.year}
                  </span>
                </div>
                <div
                  ref={tagsRef}
                  className={`work-modal-tags mt-4 flex flex-wrap gap-2 ${
                    sharedHidden ? "is-shared-hidden" : ""
                  }`}
                >
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-chip px-3 py-1 text-xs text-chip-text"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <section
              className={`mt-16 pt-16 transition-opacity duration-300 ${
                sharedContentVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              <h3 className="mb-6 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
                {mt.context}
              </h3>
              <p className="max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
                <LinkedText
                  text={project.context?.[locale] ?? mt.contextPlaceholder}
                />
              </p>
            </section>

            <section className="mt-16 pt-16">
              <h3 className="mb-8 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
                {mt.deliverables}
              </h3>
              {project.deliverables ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {project.deliverables.map((deliverable, i) =>
                    deliverable.type === "video" ? (
                      <DeliverableVideo
                        key={i}
                        src={`/projects/${project.track}/${project.slug}/${deliverable.url}`}
                      />
                    ) : deliverable.type === "instagram" ? (
                      <div key={i} className="overflow-hidden rounded-xl">
                        <blockquote
                          className="instagram-media"
                          data-instgrm-permalink={`${deliverable.url}?utm_source=ig_embed&utm_campaign=loading`}
                          data-instgrm-version="14"
                          style={{ margin: 0, width: "100%", maxWidth: "100%" }}
                        />
                      </div>
                    ) : (
                      <div
                        key={i}
                        className="aspect-[4/3] overflow-hidden rounded-lg"
                        style={{
                          background: `linear-gradient(135deg, var(--placeholder) 0%, var(--placeholder-dark) 100%)`,
                        }}
                      >
                        <div className="flex h-full items-center justify-center">
                          <span className="text-sm text-text-secondary opacity-40">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
                  {Array.from({ length: project.deliverableCount }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[4/3] overflow-hidden rounded-lg"
                      style={{
                        background: `linear-gradient(135deg, var(--placeholder) 0%, var(--placeholder-dark) 100%)`,
                      }}
                    >
                      <div className="flex h-full items-center justify-center">
                        <span className="text-sm text-text-secondary opacity-40">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-16 pt-16">
              <h3 className="mb-10 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
                {project.processTitle?.[locale] ?? mt.process}
              </h3>
              {project.processImages ? (
                <ProcessStackedCards
                  images={project.processImages}
                  assetBase={projectAssetBase(project)}
                />
              ) : project.links.youtube ? (
                <div className="space-y-6">
                  {(() => {
                    const embedUrl = youtubeEmbedUrl(project.links.youtube);
                    return embedUrl ? (
                      <div className="aspect-video w-full overflow-hidden rounded-xl bg-bg-secondary">
                        <iframe
                          src={embedUrl}
                          title={mt.youtube}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="h-full w-full border-0"
                        />
                      </div>
                    ) : null;
                  })()}
                </div>
              ) : (
                <div className="space-y-12">
                  {mt.steps.map((step, i) => (
                    <div key={step} className="grid gap-6 md:grid-cols-[80px_1fr_200px] md:items-start">
                      <span className="text-3xl font-light text-accent md:text-4xl">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4 className="text-lg font-medium text-text-primary">{step}</h4>
                        <p className="mt-2 text-sm leading-relaxed text-text-secondary md:text-base">
                          {mt.stepDescriptions[i]}
                        </p>
                      </div>
                      <div
                        className="aspect-[4/3] rounded-lg md:aspect-square"
                        style={{ background: "var(--placeholder)" }}
                        aria-hidden
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mt-16 pt-16">
              <h3 className="mb-6 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
                {mt.tools}
              </h3>
              <div className="flex flex-wrap gap-2">
                {project.tools.map((tool) => (
                  <span
                    key={tool}
                    className="rounded-full bg-chip px-3 py-1 text-xs text-chip-text"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </section>

            <section className="mt-16 pt-16">
              <h3 className="mb-6 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
                {mt.links}
              </h3>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
                {project.links.notion && (
                  <ResourceLink href={project.links.notion}>{mt.notion}</ResourceLink>
                )}
                {project.links.instagram && (
                  <ResourceLink href={project.links.instagram}>{mt.instagram}</ResourceLink>
                )}
                {project.links.tiktok && (
                  <ResourceLink href={project.links.tiktok}>{mt.tiktok}</ResourceLink>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
