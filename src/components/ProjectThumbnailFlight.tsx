"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { type ThumbnailRect, prefersReducedMotion } from "@/lib/thumbnailTransition";
import { type Project } from "@/lib/projects";

interface ProjectThumbnailFlightProps {
  project: Project;
  from: ThumbnailRect;
  to: ThumbnailRect;
  onComplete: () => void;
}

export default function ProjectThumbnailFlight({
  project,
  from,
  to,
  onComplete,
}: ProjectThumbnailFlightProps) {
  const [frame, setFrame] = useState<ThumbnailRect>(from);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      onComplete();
      return;
    }

    setMounted(true);
    setFrame(from);

    const start = requestAnimationFrame(() => {
      requestAnimationFrame(() => setFrame(to));
    });

    return () => cancelAnimationFrame(start);
  }, [from, to, project.id]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="project-thumbnail-flight pointer-events-none fixed z-[210] overflow-hidden rounded-xl bg-bg-primary"
      style={{
        top: frame.top,
        left: frame.left,
        width: frame.width,
        height: frame.height,
      }}
      onTransitionEnd={(event) => {
        if (event.propertyName === "width") onComplete();
      }}
      aria-hidden
    >
      {project.hasVideo && project.videoUrl ? (
        <video
          src={project.videoUrl}
          muted
          autoPlay
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, var(--placeholder) 0%, var(--placeholder-dark) 100%)",
            }}
          />
          <div className="flex h-full items-center justify-center">
            <span className="text-4xl font-light text-text-secondary opacity-30 md:text-5xl">
              {project.id}
            </span>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
