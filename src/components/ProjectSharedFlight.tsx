"use client";

import { useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  prefersReducedMotion,
  SHARED_TRANSITION_MS,
  type CardPerspective,
  type ElementRect,
  type FlightPair,
} from "@/lib/motion";
import {
  FLAT_PERSPECTIVE,
  flightFilterStyle,
  flightTransformStyle,
  lerpPerspective,
} from "@/lib/workCardFocus";
import { type Project } from "@/lib/projects";
import { type Locale } from "@/lib/i18n";

interface ProjectSharedFlightProps {
  project: Project;
  locale: Locale;
  flight: FlightPair;
  cardPerspective: CardPerspective;
  showVideo: boolean;
  onLanding: () => void;
  onComplete: () => void;
}

function flightElementStyle(
  frame: ElementRect,
  perspective: CardPerspective,
  amount: number,
) {
  const mixed = lerpPerspective(FLAT_PERSPECTIVE, perspective, amount);

  return {
    top: frame.top,
    left: frame.left,
    width: frame.width,
    height: frame.height,
    transform: flightTransformStyle(mixed),
    transformOrigin: "center bottom",
    opacity: mixed.bodyOpacity,
    filter: flightFilterStyle(mixed),
  } as const;
}

function FlightThumbnail({
  project,
  showVideo,
  frame,
  perspective,
  perspectiveAmount,
}: {
  project: Project;
  showVideo: boolean;
  frame: ElementRect;
  perspective: CardPerspective;
  perspectiveAmount: number;
}) {
  const layout = flightElementStyle(frame, perspective, perspectiveAmount);

  return (
    <div
      className="project-shared-flight-thumb relative overflow-hidden rounded-xl bg-bg-primary"
      style={layout}
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
  perspective,
  perspectiveAmount,
}: {
  title: string;
  frame: ElementRect;
  fontSize: string;
  perspective: CardPerspective;
  perspectiveAmount: number;
}) {
  return (
    <div
      className="project-shared-flight-title font-medium tracking-tight text-text-primary"
      style={{
        ...flightElementStyle(frame, perspective, perspectiveAmount),
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
  perspective,
  perspectiveAmount,
}: {
  year: string;
  frame: ElementRect;
  fontSize: string;
  perspective: CardPerspective;
  perspectiveAmount: number;
}) {
  return (
    <div
      className="project-shared-flight-year shrink-0 text-text-secondary"
      style={{
        ...flightElementStyle(frame, perspective, perspectiveAmount),
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
  perspective,
  perspectiveAmount,
}: {
  tags: string[];
  frame: ElementRect;
  variant: "card" | "modal";
  perspective: CardPerspective;
  perspectiveAmount: number;
}) {
  const isCard = variant === "card";
  const layout = flightElementStyle(frame, perspective, perspectiveAmount);

  return (
    <div
      className={`project-shared-flight-tags flex flex-wrap items-center ${
        isCard ? "gap-1.5" : "gap-2"
      }`}
      style={layout}
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
  cardPerspective,
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
  const [perspectiveAmount, setPerspectiveAmount] = useState(
    flight.direction === "open" ? 1 : 0,
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

    if (flight.direction === "close") {
      onCompleteRef.current();
      return;
    }

    onLandingRef.current();
    setOpacity(0);
    window.setTimeout(() => onCompleteRef.current(), 100);
  }, [flight.direction]);

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
    setPerspectiveAmount(flight.direction === "open" ? 1 : 0);

    const start = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setThumbFrame(flight.thumbnail.to);
        setTitleFrame(flight.title.to);
        setTitleFontSize(flight.title.toFontSize);
        setYearFrame(flight.year.to);
        setYearFontSize(flight.year.toFontSize);
        setTagsFrame(flight.tags.to);
        setTagsVariant(flight.direction === "open" ? "modal" : "card");
        setPerspectiveAmount(flight.direction === "open" ? 0 : 1);
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
      className={`project-shared-flight pointer-events-none fixed inset-0 z-[220] ${
        flight.direction === "close" ? "is-closing" : ""
      }`}
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
        <FlightThumbnail
          project={project}
          showVideo={showVideo}
          frame={thumbFrame}
          perspective={cardPerspective}
          perspectiveAmount={perspectiveAmount}
        />
        <FlightTitle
          title={project.title[locale]}
          frame={titleFrame}
          fontSize={titleFontSize}
          perspective={cardPerspective}
          perspectiveAmount={perspectiveAmount}
        />
        <FlightYear
          year={project.year}
          frame={yearFrame}
          fontSize={yearFontSize}
          perspective={cardPerspective}
          perspectiveAmount={perspectiveAmount}
        />
        <FlightTags
          tags={project.tags}
          frame={tagsFrame}
          variant={tagsVariant}
          perspective={cardPerspective}
          perspectiveAmount={perspectiveAmount}
        />
      </div>
    </div>,
    document.body,
  );
}
