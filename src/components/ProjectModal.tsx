"use client";

import { useEffect, useCallback, useRef, useLayoutEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/contexts/LocaleContext";
import { useScrollLock } from "@/hooks/useScrollLock";
import { translations } from "@/lib/i18n";
import { type Project } from "@/lib/projects";
import {
  prefersReducedMotion,
  toThumbnailRect,
  type ThumbnailRect,
} from "@/lib/thumbnailTransition";
import ProjectThumbnailFlight from "./ProjectThumbnailFlight";

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  total: number;
  thumbnailOrigin?: ThumbnailRect | null;
  onThumbnailTransitionComplete?: () => void;
}

function ResourceLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
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

export default function ProjectModal({
  project,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  total,
  thumbnailOrigin = null,
  onThumbnailTransitionComplete,
}: ProjectModalProps) {
  const { locale } = useLocale();
  const t = translations[locale];
  const mt = t.modal;
  const modalRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(!thumbnailOrigin || prefersReducedMotion());
  const [showFlight, setShowFlight] = useState(false);
  const [flightTarget, setFlightTarget] = useState<ThumbnailRect | null>(null);

  useScrollLock(true);

  useLayoutEffect(() => {
    modalRef.current?.scrollTo({ top: 0, left: 0 });

    if (!thumbnailOrigin || prefersReducedMotion()) {
      setRevealed(true);
      setShowFlight(false);
      setFlightTarget(null);
      return;
    }

    const hero = heroRef.current;
    if (!hero) {
      setRevealed(true);
      return;
    }

    setRevealed(false);
    setFlightTarget(toThumbnailRect(hero.getBoundingClientRect()));
    setShowFlight(true);
  }, [project.id, thumbnailOrigin]);

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
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (typeof document === "undefined") return null;

  const handleFlightComplete = () => {
    setShowFlight(false);
    setRevealed(true);
    onThumbnailTransitionComplete?.();
  };

  return createPortal(
    <>
      {showFlight && thumbnailOrigin && flightTarget && (
        <ProjectThumbnailFlight
          project={project}
          from={thumbnailOrigin}
          to={flightTarget}
          onComplete={handleFlightComplete}
        />
      )}
      <div
        ref={modalRef}
        className="project-modal fixed inset-0 z-[200] overflow-y-auto overscroll-contain"
        style={{
          background: revealed ? "var(--modal-bg)" : "transparent",
          transition: "background 0.45s ease",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={project.title[locale]}
      >
        <div
          className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 transition-opacity duration-500 md:px-10 ${
            revealed ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background: "var(--modal-bg)",
          }}
        >
        <span className="text-xs tracking-widest text-text-secondary uppercase">
          {String(currentIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary"
            aria-label="Previous project"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary"
            aria-label="Next project"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M7 3l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 pb-24 md:px-10">
        {/* Zone 1 — Hero deliverable */}
        <div className="pt-8 md:pt-12">
          <div
            ref={heroRef}
            className={`aspect-video w-full overflow-hidden rounded-xl transition-opacity duration-300 ${
              revealed || !showFlight ? "opacity-100" : "opacity-0"
            }`}
            style={{ background: "var(--placeholder)" }}
          >
            {project.hasVideo && project.videoUrl ? (
              <video
                src={project.videoUrl}
                controls
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <span className="text-6xl font-light text-text-secondary opacity-30">
                  {project.id}
                </span>
              </div>
            )}
          </div>

          <div
            className={`mt-8 transition-all duration-500 ${
              revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <h2 className="text-2xl font-medium tracking-tight text-text-primary md:text-4xl">
              {project.title[locale]}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {project.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-secondary"
                >
                  {tag}
                </span>
              ))}
              <span className="text-sm text-text-secondary">{project.year}</span>
            </div>
          </div>
        </div>

        {/* Zone 2 — Context */}
        <section
          className={`mt-16 pt-16 transition-all duration-500 delay-75 ${
            revealed ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <h3 className="mb-6 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
            {mt.context}
          </h3>
          <p className="max-w-2xl text-base leading-relaxed text-text-secondary md:text-lg">
            {mt.contextPlaceholder}
          </p>
        </section>

        {/* Zone 3 — All deliverables */}
        <section className="mt-16 pt-16">
          <h3 className="mb-8 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
            {mt.deliverables}
          </h3>
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
        </section>

        {/* Zone 4 — Process */}
        <section className="mt-16 pt-16">
          <h3 className="mb-10 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
            {mt.process}
          </h3>
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
        </section>

        {/* Zone 5 — Tools */}
        <section className="mt-16 pt-16">
          <h3 className="mb-6 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
            {mt.tools}
          </h3>
          <div className="flex flex-wrap gap-2">
            {project.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full bg-bg-secondary px-3 py-1 text-xs text-text-secondary"
              >
                {tool}
              </span>
            ))}
          </div>
        </section>

        {/* Zone 6 — Links */}
        <section className="mt-16 pt-16">
          <h3 className="mb-6 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
            {mt.links}
          </h3>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
            {project.links.notion && (
              <ResourceLink href={project.links.notion}>{mt.notion}</ResourceLink>
            )}
            {project.links.youtube && (
              <ResourceLink href={project.links.youtube}>{mt.youtube}</ResourceLink>
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
    </>,
    document.body,
  );
}
