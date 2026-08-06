"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import { toRect, type CardOrigin } from "@/lib/motion";
import type { Project } from "@/lib/projects";
import { projectThumbnailUrl, projectVideoPosterUrl } from "@/lib/projects";
import { computeCardFocus, FLAT_PERSPECTIVE } from "@/lib/workCardFocus";
import { shouldIgnoreWorkCardClick } from "@/lib/workDragScroll";

interface ProjectCardProps {
  project: Project;
  loopInstance?: string;
  onOpen: (project: Project, origin: CardOrigin | null) => void;
  isSharedHidden?: boolean;
  keepVideoAlive?: boolean;
}

/** Reveal "View project" on touch after this hold. */
const HOLD_MS = 200;
/** Any finger travel beyond this cancels hold and blocks open-on-release. */
const MOVE_CANCEL_PX = 10;

type PressState = {
  pointerId: number;
  startX: number;
  startY: number;
  held: boolean;
  cancelled: boolean;
  timer: number | null;
};

function isTouchLikePointer(event: React.PointerEvent) {
  if (event.pointerType === "touch" || event.pointerType === "pen") return true;
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(hover: none)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

const ProjectCard = forwardRef<HTMLElement, ProjectCardProps>(function ProjectCard(
  { project, loopInstance, onOpen, isSharedHidden = false, keepVideoAlive = false },
  ref,
) {
  const { locale } = useLocale();
  const t = translations[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const pressRef = useRef<PressState | null>(null);
  const suppressClickRef = useRef(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isCtaVisible, setIsCtaVisible] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const thumbnailUrl = projectThumbnailUrl(project);
  const videoPosterUrl = projectVideoPosterUrl(project);
  const videoIsHero = project.hasVideo && !!project.videoUrl && !thumbnailUrl;
  const coverStillUrl = thumbnailUrl ?? videoPosterUrl;
  const isVideoMounted = isNearViewport || keepVideoAlive;

  const setCardNode = useCallback(
    (node: HTMLElement | null) => {
      cardRef.current = node;
      if (typeof ref === "function") {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    },
    [ref],
  );

  const pauseHoverVideo = useCallback(() => {
    if (videoIsHero || keepVideoAlive || !videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }, [keepVideoAlive, videoIsHero]);

  const clearPressTimer = () => {
    const press = pressRef.current;
    if (press?.timer != null) {
      window.clearTimeout(press.timer);
      press.timer = null;
    }
  };

  const armClickSuppress = () => {
    suppressClickRef.current = true;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 400);
  };

  // The carousel repeats every project many times to loop seamlessly, so only
  // copies approaching the viewport get a video element at all.
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsNearViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        setIsNearViewport(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: "150% 0px" },
    );
    observer.observe(card);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoIsHero || !isVideoMounted) return;

    video.play().catch(() => {});
  }, [videoIsHero, isVideoMounted]);

  // The loop wraps by one full cycle, which swaps the visible copies for freshly
  // mounted ones. Revealing their video before it has a decoded frame paints a
  // gap over the cover still, which reads as a blink at the wrap.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoMounted) {
      setIsVideoReady(false);
      return;
    }

    if (video.readyState >= 2) {
      setIsVideoReady(true);
      return;
    }

    setIsVideoReady(false);
    const onReady = () => setIsVideoReady(true);
    video.addEventListener("loadeddata", onReady);
    return () => video.removeEventListener("loadeddata", onReady);
  }, [isVideoMounted, project.videoUrl]);

  // Native mobile carousel scroll often skips pointermove; cancel hold on scroll.
  useEffect(() => {
    const card = cardRef.current;
    const scroll = card?.closest(".work-scroll");
    if (!scroll) return;

    const onScroll = () => {
      const press = pressRef.current;
      if (!press) return;
      press.cancelled = true;
      clearPressTimer();
      setIsCtaVisible(false);
      if (press.held) {
        setIsHovering(false);
        pauseHoverVideo();
      }
    };

    scroll.addEventListener("scroll", onScroll, { passive: true });
    return () => scroll.removeEventListener("scroll", onScroll);
  }, [pauseHoverVideo]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (project.hasVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    pauseHoverVideo();
  };

  const openFromCard = () => {
    const visual = visualRef.current;
    const title = titleRef.current;
    const card = visual?.closest<HTMLElement>("[data-project-id]");

    if (!visual || !title || !card) {
      onOpen(project, null);
      return;
    }

    const year = card.querySelector<HTMLElement>(".work-card-year");
    const tags = card.querySelector<HTMLElement>(".work-card-tags");

    if (!year || !tags) {
      onOpen(project, null);
      return;
    }

    onOpen(project, {
      carouselInstanceId: loopInstance,
      thumbnail: toRect(visual.getBoundingClientRect()),
      title: toRect(title.getBoundingClientRect()),
      titleFontSize: getComputedStyle(title).fontSize,
      year: toRect(year.getBoundingClientRect()),
      yearFontSize: getComputedStyle(year).fontSize,
      tags: toRect(tags.getBoundingClientRect()),
      perspective: (() => {
        const container = card.closest<HTMLElement>(".work-scroll");
        return container ? computeCardFocus(card, container) : FLAT_PERSPECTIVE;
      })(),
      // videoIsHero cards autoplay their video permanently (no thumbnail to
      // fall back to), independent of hover — which never fires on touch.
      // Without this, tapping such a card on mobile always reported
      // showVideo:false, and the flight thumbnail fell through to the
      // numbered placeholder since there's no cover/thumbnail image either.
      showVideo: (isHovering || isCtaVisible || videoIsHero) && !!project.hasVideo,
      videoTime:
        (isHovering || isCtaVisible || videoIsHero) &&
        project.hasVideo &&
        videoRef.current
          ? videoRef.current.currentTime
          : 0,
    });
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (suppressClickRef.current) return;
    if (shouldIgnoreWorkCardClick(event.currentTarget)) return;
    openFromCard();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (shouldIgnoreWorkCardClick(event.currentTarget)) return;
      openFromCard();
    }
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    // Desktop mouse uses CSS :hover for the CTA; hold is a touch affordance.
    if (event.pointerType === "mouse" && !isTouchLikePointer(event)) return;

    clearPressTimer();
    const timer = window.setTimeout(() => {
      const press = pressRef.current;
      if (!press || press.cancelled) return;
      press.held = true;
      setIsCtaVisible(true);
      setIsHovering(true);
      if (project.hasVideo && videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    }, HOLD_MS);

    pressRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      held: false,
      cancelled: false,
      timer,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const press = pressRef.current;
    if (!press || press.pointerId !== event.pointerId || press.cancelled) return;

    const dx = event.clientX - press.startX;
    const dy = event.clientY - press.startY;
    if (Math.hypot(dx, dy) < MOVE_CANCEL_PX) return;

    press.cancelled = true;
    clearPressTimer();
    setIsCtaVisible(false);
    if (press.held) {
      setIsHovering(false);
      pauseHoverVideo();
    }
  };

  const finishPress = (event: React.PointerEvent<HTMLElement>, forceCancel = false) => {
    const press = pressRef.current;
    if (!press || press.pointerId !== event.pointerId) return;

    clearPressTimer();
    const { held, cancelled } = press;
    pressRef.current = null;

    if (forceCancel || cancelled) {
      setIsCtaVisible(false);
      if (held) {
        setIsHovering(false);
        pauseHoverVideo();
      }
      armClickSuppress();
      return;
    }

    const stillOnCard = (() => {
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      return !!(hit && cardRef.current?.contains(hit));
    })();

    if (held) {
      setIsCtaVisible(false);
      armClickSuppress();
      if (stillOnCard) {
        openFromCard();
      } else {
        setIsHovering(false);
        pauseHoverVideo();
      }
      return;
    }

    // Quick tap: leave opening to the click handler.
    setIsCtaVisible(false);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    finishPress(event, false);
  };

  const handlePointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    finishPress(event, true);
  };

  const hiddenClass = isSharedHidden ? "is-shared-hidden" : "";

  return (
    <article
      ref={setCardNode}
      data-project-id={project.id}
      data-work-instance={loopInstance}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`work-card-focus group w-[62vw] max-w-[44rem] shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-[56vw] lg:w-[50vw]${
        isCtaVisible ? " is-cta-visible" : ""
      }`}
      aria-label={`${t.viewProject}: ${project.title[locale]}`}
    >
      <div className="work-card-body">
        <div
          ref={visualRef}
          className={`work-card-visual relative aspect-video w-full overflow-hidden rounded-xl ${hiddenClass}`}
        >
          <div className="work-card-media relative h-full w-full">
            <div className="absolute inset-0">
              {/* A still always sits under the video: the cover then shows the
                  instant a card scrolls into view, with no video bytes needed.
                  Hero covers hide it only once the video is actually playing. */}
              {coverStillUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coverStillUrl}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-400 ${
                    isHovering && project.hasVideo && thumbnailUrl && isVideoReady
                      ? "opacity-0"
                      : "opacity-100"
                  }`}
                />
              ) : (
                <div
                  className={`project-placeholder-gradient absolute inset-0 transition-opacity duration-400 ${
                    isHovering && project.hasVideo && isVideoReady
                      ? "opacity-0"
                      : "opacity-100"
                  }`}
                  aria-hidden
                >
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl font-light text-text-secondary opacity-30 md:text-5xl">
                      {project.id}
                    </span>
                  </div>
                </div>
              )}

              {/* Mounted near the viewport only: the loop repeats every project
                  many times, and dozens of video elements would compete for
                  bandwidth and decoders. */}
              {project.hasVideo && project.videoUrl && isVideoMounted && (
                <video
                  ref={videoRef}
                  src={project.videoUrl}
                  poster={videoPosterUrl ?? undefined}
                  autoPlay={videoIsHero}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-400 ${
                    (videoIsHero || isHovering) && isVideoReady
                      ? "opacity-100"
                      : "opacity-0"
                  }`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="work-card-meta relative mt-2.5 space-y-1 md:mt-5 md:space-y-2">
          <h3
            ref={titleRef}
            className={`work-card-title text-lg font-medium tracking-tight text-text-secondary transition-colors duration-200 md:text-xl ${hiddenClass}`}
          >
            {project.title[locale]}
          </h3>

          {/* Year and tags are hidden on the home carousel but stay mounted:
              the shared-element flight measures them to fly into the modal. */}
          <span
            className={`work-card-year pointer-events-none absolute right-0 top-0 shrink-0 text-xs text-text-secondary opacity-0 ${hiddenClass}`}
            aria-hidden
          >
            {project.year}
          </span>

          <div
            className={`work-card-tags pointer-events-none absolute inset-x-0 top-7 flex flex-wrap gap-1.5 opacity-0 ${hiddenClass}`}
            aria-hidden
          >
            {project.tags.map((tag) => (
              <span
                key={tag.en}
                className="rounded-full bg-chip px-2.5 py-0.5 text-xs text-chip-text"
              >
                {tag[locale]}
              </span>
            ))}
          </div>

          <span
            className="work-card-cta inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary"
            aria-hidden={!isCtaVisible}
          >
            {t.viewProject}
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M1 7h12M8 2l5 5-5 5"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </article>
  );
});

export default ProjectCard;
