"use client";

import { forwardRef, useRef, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import { type Project } from "@/lib/projects";

interface ProjectCardProps {
  project: Project;
  onOpen: (project: Project) => void;
}

const ProjectCard = forwardRef<HTMLElement, ProjectCardProps>(function ProjectCard(
  { project, onOpen },
  ref,
) {
  const { locale } = useLocale();
  const t = translations[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseEnter = () => {
    setIsHovering(true);
    if (project.hasVideo && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen(project);
    }
  };

  return (
    <article
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(project)}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="work-card-focus group w-[88vw] max-w-[68rem] shrink-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-accent md:w-[85vw] lg:w-[82vw]"
      aria-label={`${t.viewProject}: ${project.title[locale]}`}
    >
      <div className="work-card-body">
        <div className="work-card-visual relative aspect-video w-full overflow-hidden rounded-xl bg-bg-primary">
          <div className="work-card-media relative h-full w-full">
            <div className="absolute inset-0">
              <div
                className={`absolute inset-0 transition-opacity duration-400 ${
                  isHovering && project.hasVideo ? "opacity-0" : "opacity-100"
                }`}
                style={{
                  background: `linear-gradient(135deg, var(--placeholder) 0%, var(--placeholder-dark) 100%)`,
                }}
                aria-hidden
              >
                <div className="flex h-full items-center justify-center">
                  <span className="text-4xl font-light text-text-secondary opacity-30 md:text-5xl">
                    {project.id}
                  </span>
                </div>
              </div>

              {project.hasVideo && project.videoUrl && (
                <video
                  ref={videoRef}
                  src={project.videoUrl}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-400 ${
                    isHovering ? "opacity-100" : "opacity-0"
                  }`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="work-card-meta mt-5 space-y-2">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="text-lg font-medium tracking-tight text-text-primary md:text-xl">
              {project.title[locale]}
            </h3>
            <span className="shrink-0 text-xs text-text-secondary">{project.year}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-bg-secondary px-2.5 py-0.5 text-xs text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-text-secondary md:text-base">
            {project.description[locale]}
          </p>

          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors group-hover:text-text-primary">
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
