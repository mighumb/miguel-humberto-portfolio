"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  prefersReducedMotion,
  type ElementRect,
  type FlightPair,
} from "@/lib/motion";
import { type Project } from "@/lib/projects";
import { type Locale } from "@/lib/i18n";

interface ProjectSharedFlightProps {
  project: Project;
  locale: Locale;
  flight: FlightPair;
  showVideo: boolean;
  onLanding: () => void;
  onComplete: () => void;
}

function FlightThumbnail({
  project,
  showVideo,
  frame,
}: {
  project: Project;
  showVideo: boolean;
  frame: ElementRect;
}) {
  return (
    <div
      className="project-shared-flight-thumb relative overflow-hidden rounded-xl bg-bg-primary"
      style={{
        top: frame.top,
        left: frame.left,
        width: frame.width,
        height: frame.height,
      }}
    >
      {showVideo && project.hasVideo && project.videoUrl ? (
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
    </div>
  );
}

function FlightTitle({
  title,
  frame,
  fontSize,
}: {
  title: string;
  frame: ElementRect;
  fontSize: string;
}) {
  return (
    <div
      className="project-shared-flight-title font-medium tracking-tight text-text-primary"
      style={{
        top: frame.top,
        left: frame.left,
        width: frame.width,
        height: frame.height,
        fontSize,
      }}
    >
      {title}
    </div>
  );
}

export default function ProjectSharedFlight({
  project,
  locale,
  flight,
  showVideo,
  onLanding,
  onComplete,
}: ProjectSharedFlightProps) {
  const [thumbFrame, setThumbFrame] = useState(flight.thumbnail.from);
  const [titleFrame, setTitleFrame] = useState(flight.title.from);
  const [titleFontSize, setTitleFontSize] = useState(flight.title.fromFontSize);
  const [opacity, setOpacity] = useState(1);
  const completedRef = useRef(false);
  const thumbRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      onComplete();
      return;
    }

    completedRef.current = false;
    setOpacity(1);
    setThumbFrame(flight.thumbnail.from);
    setTitleFrame(flight.title.from);
    setTitleFontSize(flight.title.fromFontSize);

    const start = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setThumbFrame(flight.thumbnail.to);
        setTitleFrame(flight.title.to);
        setTitleFontSize(flight.title.toFontSize);
      });
    });

    return () => cancelAnimationFrame(start);
  }, [flight, onComplete]);

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onLanding();
    setOpacity(0);
    window.setTimeout(onComplete, 100);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="project-shared-flight pointer-events-none fixed inset-0 z-[220]"
      style={{ opacity }}
      aria-hidden
    >
      <div
        ref={thumbRef}
        onTransitionEnd={(event) => {
          if (event.propertyName !== "width" || event.currentTarget !== thumbRef.current) return;
          finish();
        }}
      >
        <FlightThumbnail project={project} showVideo={showVideo} frame={thumbFrame} />
        <FlightTitle
          title={project.title[locale]}
          frame={titleFrame}
          fontSize={titleFontSize}
        />
      </div>
    </div>,
    document.body,
  );
}
