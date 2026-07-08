"use client";

import { useRef, useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import { type Project } from "@/lib/projects";

const LAYOUTS = [
  { width: "w-[82vw] sm:w-[28rem] md:w-[44rem]", aspect: "aspect-[16/10]", offset: "" },
  { width: "w-[72vw] sm:w-[24rem] md:w-[32rem]", aspect: "aspect-[4/3]", offset: "md:mt-20" },
  { width: "w-[76vw] sm:w-[26rem] md:w-[36rem]", aspect: "aspect-[4/3]", offset: "md:mt-8" },
  { width: "w-[82vw] sm:w-[28rem] md:w-[42rem]", aspect: "aspect-[16/10]", offset: "md:mt-24" },
  { width: "w-[68vw] sm:w-[22rem] md:w-[30rem]", aspect: "aspect-[4/3]", offset: "" },
  { width: "w-[74vw] sm:w-[25rem] md:w-[34rem]", aspect: "aspect-[4/3]", offset: "md:mt-16" },
] as const;

interface ProjectCardProps {
  project: Project;
  index: number;
  onOpen: (project: Project) => void;
}

export default function ProjectCard({ project, index, onOpen }: ProjectCardProps) {
  const { locale } = useLocale();
  const t = translations[locale];
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const layout = LAYOUTS[index % LAYOUTS.length];

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

  return (
    <article
      className={`group shrink-0 snap-start ${layout.width} ${layout.offset}`}
    >
      <button
        type="button"
        onClick={() => onOpen(project)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="work-card-3d w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label={`${t.viewProject}: ${project.title[locale]}`}
      >
        <div
          className={`relative ${layout.aspect} w-full overflow-hidden rounded-xl`}
          style={{ background: "var(--placeholder)" }}
        >
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

        <div className="mt-5 space-y-2 pr-2">
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
                className="rounded-full border border-border px-2.5 py-0.5 text-xs text-text-secondary"
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
      </button>
    </article>
  );
}
