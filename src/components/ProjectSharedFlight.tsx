"use client";

import { useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  prefersReducedMotion,
  SHARED_TRANSITION_MS,
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

const FLIGHT_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

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

function FlightYear({
  year,
  frame,
  fontSize,
}: {
  year: string;
  frame: ElementRect;
  fontSize: string;
}) {
  return (
    <div
      className="project-shared-flight-year shrink-0 text-text-secondary"
      style={{
        top: frame.top,
        left: frame.left,
        width: frame.width,
        height: frame.height,
        fontSize,
      }}
    >
      {year}
    </div>
  );
}

function FlightTags({
  tags,
  frame,
  variant,
}: {
  tags: string[];
  frame: ElementRect;
  variant: "card" | "modal";
}) {
  const isCard = variant === "card";

  return (
    <div
      className={`project-shared-flight-tags flex flex-wrap items-center ${
        isCard ? "gap-1.5" : "gap-2"
      }`}
      style={{
        top: frame.top,
        left: frame.left,
        width: frame.width,
        height: frame.height,
      }}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-full bg-bg-secondary text-text-secondary ${
            isCard ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-xs"
          }`}
        >
          {tag}
        </span>
      ))}
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
  const [yearFrame, setYearFrame] = useState(flight.year.from);
  const [yearFontSize, setYearFontSize] = useState(flight.year.fromFontSize);
  const [tagsFrame, setTagsFrame] = useState(flight.tags.from);
  const [tagsVariant, setTagsVariant] = useState<"card" | "modal">(
    flight.direction === "open" ? "card" : "modal",
  );
  const [opacity, setOpacity] = useState(1);
  const completedRef = useRef(false);
  const thumbRef = useRef<HTMLDivElement>(null);
  const onLandingRef = useRef(onLanding);
  const onCompleteRef = useRef(onComplete);
  onLandingRef.current = onLanding;
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onLandingRef.current();
    setOpacity(0);
    window.setTimeout(() => onCompleteRef.current(), 100);
  }, []);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      onCompleteRef.current();
      return;
    }

    completedRef.current = false;
    setOpacity(1);
    setThumbFrame(flight.thumbnail.from);
    setTitleFrame(flight.title.from);
    setTitleFontSize(flight.title.fromFontSize);
    setYearFrame(flight.year.from);
    setYearFontSize(flight.year.fromFontSize);
    setTagsFrame(flight.tags.from);
    setTagsVariant(flight.direction === "open" ? "card" : "modal");

    const start = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setThumbFrame(flight.thumbnail.to);
        setTitleFrame(flight.title.to);
        setTitleFontSize(flight.title.toFontSize);
        setYearFrame(flight.year.to);
        setYearFontSize(flight.year.toFontSize);
        setTagsFrame(flight.tags.to);
        setTagsVariant(flight.direction === "open" ? "modal" : "card");
      });
    });

    const timeout = window.setTimeout(finish, SHARED_TRANSITION_MS + 80);

    return () => {
      cancelAnimationFrame(start);
      window.clearTimeout(timeout);
    };
  }, [flight, finish]);

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
        <FlightYear year={project.year} frame={yearFrame} fontSize={yearFontSize} />
        <FlightTags tags={project.tags} frame={tagsFrame} variant={tagsVariant} />
      </div>
    </div>,
    document.body,
  );
}
