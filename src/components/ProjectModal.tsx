"use client";

import { useEffect, useCallback } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import { type Project } from "@/lib/projects";

interface ProjectModalProps {
  project: Project;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  currentIndex: number;
  total: number;
}

export default function ProjectModal({
  project,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  total,
}: ProjectModalProps) {
  const { locale } = useLocale();
  const t = translations[locale];
  const mt = t.modal;

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

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      style={{ background: "var(--modal-bg)" }}
      role="dialog"
      aria-modal="true"
      aria-label={project.title[locale]}
    >
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 md:px-10"
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
            className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-secondary text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Previous project"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-secondary text-text-secondary transition-colors hover:text-text-primary"
            aria-label="Next project"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M7 3l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-bg-secondary text-text-secondary transition-colors hover:text-text-primary"
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
            className="aspect-video w-full overflow-hidden rounded-xl"
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

          <div className="mt-8">
            <h2 className="text-2xl font-medium tracking-tight text-text-primary md:text-4xl">
              {project.title[locale]}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-3">
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
        <section className="mt-16 pt-16">
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
          <div className="flex flex-wrap gap-3">
            {project.tools.map((tool) => (
              <span
                key={tool}
                className="rounded-full bg-bg-secondary px-4 py-2 text-sm text-text-secondary"
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
          <div className="flex flex-wrap gap-4">
            {project.links.notion && (
              <a
                href={project.links.notion}
                className="inline-flex items-center gap-2 rounded-full bg-bg-secondary px-5 py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {mt.notion}
              </a>
            )}
            {project.links.youtube && (
              <a
                href={project.links.youtube}
                className="inline-flex items-center gap-2 rounded-full bg-bg-secondary px-5 py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {mt.youtube}
              </a>
            )}
            {project.links.instagram && (
              <a
                href={project.links.instagram}
                className="inline-flex items-center gap-2 rounded-full bg-bg-secondary px-5 py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {mt.instagram}
              </a>
            )}
            {project.links.tiktok && (
              <a
                href={project.links.tiktok}
                className="inline-flex items-center gap-2 rounded-full bg-bg-secondary px-5 py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                {mt.tiktok}
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
