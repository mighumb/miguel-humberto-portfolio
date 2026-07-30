"use client";

import { useEffect, useCallback, useRef, useLayoutEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLocale } from "@/contexts/LocaleContext";
import { useScrollLock } from "@/hooks/useScrollLock";
import { translations } from "@/lib/i18n";
import { toRect, type ModalTargets } from "@/lib/motion";
import { type Project, type Deliverable, projectCoverUrl } from "@/lib/projects";
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

  useScrollLock(true);

  useLayoutEffect(() => {
    const video = heroVideoRef.current;
    if (!video || !project.hasVideo || !videoPlaying) return;
    syncVideoPlayback(video, videoTime);
  }, [project.id, project.hasVideo, videoPlaying, videoTime]);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video || !project.hasVideo || !project.videoUrl || videoPlaying) return;
    if (sharedContentVisible) {
      video.play().catch(() => {});
    }
  }, [sharedContentVisible, project.hasVideo, project.videoUrl, project.id, videoPlaying]);

  useEffect(() => {
    const hasInstagram = project.deliverables?.some((d: Deliverable) => d.type === "instagram");
    if (!hasInstagram || !sharedContentVisible) return;

    const process = () => {
      (window as { instgrm?: { Embeds?: { process?: () => void } } }).instgrm?.Embeds?.process?.();
    };

    if ((window as { instgrm?: unknown }).instgrm) {
      process();
      return;
    }

    const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
    if (existing) {
      existing.addEventListener("load", process, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.instagram.com/embed.js";
    script.async = true;
    script.onload = process;
    document.body.appendChild(script);
  }, [project.deliverables, sharedContentVisible]);

  const measureTargets = useCallback((): ModalTargets | null => {
    const hero = heroRef.current;
    const title = titleRef.current;
    const year = yearRef.current;
    const tags = tagsRef.current;
    if (!hero || !title || !year || !tags) return null;

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
            style={{ background: "var(--modal-bg)" }}
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
                className={`project-modal-hero aspect-video w-full overflow-hidden rounded-xl ${
                  coverUrl || (project.hasVideo && project.videoUrl)
                    ? "bg-bg-secondary"
                    : "project-placeholder-gradient"
                } ${sharedHidden ? "is-shared-hidden" : ""}`}
              >
                {project.hasVideo && project.videoUrl ? (
                  <video
                    ref={heroVideoRef}
                    src={project.videoUrl}
                    controls={sharedContentVisible}
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload={videoPlaying ? "auto" : "metadata"}
                    className="h-full w-full object-cover"
                  />
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
                    deliverable.type === "instagram" ? (
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
                {mt.process}
              </h3>
              {project.links.youtube ? (
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
