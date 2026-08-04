"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import { toRect, type CardOrigin } from "@/lib/motion";
import type { Project } from "@/lib/projects";
import { projectThumbnailUrl } from "@/lib/projects";
import { computeCardFocus, FLAT_PERSPECTIVE } from "@/lib/workCardFocus";
import { shouldIgnoreWorkCardClick } from "@/lib/workDragScroll";

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project, origin: CardOrigin | null) => void;
  isSharedHidden?: boolean;
  keepVideoAlive?: boolean;
}

const ProjectCard = forwardRef<HTMLElement, ProjectCardProps>(function ProjectCard(
  { project, onOpen, isSharedHidden = false, keepVideoAlive = false },
  ref,
) {
  const { locale } = useLocale();
  const t = translations[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const thumbnailUrl = projectThumbnailUrl(project);
  const videoIsHero = project.hasVideo && !!project.videoUrl && !thumbnailUrl;

  useEffect(() => {
    if (!videoIsHero || !videoRef.current) return;
    videoRef.current.play().catch(() => {});
  }, [videoIsHero]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (project.hasVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoIsHero || keepVideoAlive || !videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
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
      showVideo: (isHovering || videoIsHero) && !!project.hasVideo,
      videoTime:
        (isHovering || videoIsHero) && project.hasVideo && videoRef.current
          ? videoRef.current.currentTime
          : 0,
    });
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
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

  const hiddenClass = isSharedHidden ? "is-shared-hidden" : "";

  return (
    <article
      ref={ref}
      data-project-id={project.id}
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="work-card-focus group w-[62vw] max-w-[44rem] shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-[56vw] lg:w-[50vw]"
      aria-label={`${t.viewProject}: ${project.title[locale]}`}
    >
      <div className="work-card-body">
        <div
          ref={visualRef}
          className={`work-card-visual relative aspect-video w-full overflow-hidden rounded-xl ${hiddenClass}`}
        >
          <div className="work-card-media relative h-full w-full">
            <div className="absolute inset-0">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-400 ${
                    isHovering && project.hasVideo ? "opacity-0" : "opacity-100"
                  }`}
                />
              ) : !videoIsHero ? (
                <div
                  className={`project-placeholder-gradient absolute inset-0 transition-opacity duration-400 ${
                    isHovering && project.hasVideo ? "opacity-0" : "opacity-100"
                  }`}
                  aria-hidden
                >
                  <div className="flex h-full items-center justify-center">
                    <span className="text-4xl font-light text-text-secondary opacity-30 md:text-5xl">
                      {project.id}
                    </span>
                  </div>
                </div>
              ) : null}

              {project.hasVideo && project.videoUrl && (
                <video
                  ref={videoRef}
                  src={project.videoUrl}
                  autoPlay={videoIsHero}
                  muted
                  loop
                  playsInline
                  preload={videoIsHero ? "auto" : "metadata"}
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-400 ${
                    videoIsHero || isHovering ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="work-card-meta relative mt-5 space-y-2">
          <h3
            ref={titleRef}
            className={`work-card-title text-lg font-medium tracking-tight text-text-primary md:text-xl ${hiddenClass}`}
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
                key={tag}
                className="rounded-full bg-chip px-2.5 py-0.5 text-xs text-chip-text"
              >
                {tag}
              </span>
            ))}
          </div>

          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors group-hover:text-text-primary">
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
