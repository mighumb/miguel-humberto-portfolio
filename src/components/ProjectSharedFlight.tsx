"use client";

import { useLayoutEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  prefersReducedMotion,
  SHARED_TRANSITION_MS,
  type ElementRect,
  type FlightPair,
} from "@/lib/motion";
import { type Project, projectCoverUrl } from "@/lib/projects";
import { type Locale } from "@/lib/i18n";
import { syncVideoPlayback } from "@/lib/videoHandoff";

interface ProjectSharedFlightProps {
  project: Project;
  locale: Locale;
  flight: FlightPair;
  showVideo: boolean;
  videoTime: number;
  videoPoster?: string;
  onLanding: (handoffVideoTime?: number) => void;
}

function frameStyle(frame: ElementRect) {
  return {
    top: frame.top,
    left: frame.left,
    width: frame.width,
    height: frame.height,
  };
}

function FlightThumbnail({
  project,
  showVideo,
  frame,
  videoTime,
  videoPoster,
}: {
  project: Project;
  showVideo: boolean;
  frame: ElementRect;
  videoTime: number;
  videoPoster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const coverUrl = projectCoverUrl(project);

  // Touch devices get a frozen flight: mounting a fresh <video> mid-transition
  // means a decode race that mobile Safari loses more often than not (poster
  // and overlay tricks included), flashing black during the ~0.6s flight.
  // The frame captured at tap time is pixel-identical to what the card showed,
  // and the modal hero takes over the actual playback at landing.
  const [isTouch] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches,
  );
  const useLiveVideo =
    showVideo && !!project.hasVideo && !!project.videoUrl && !(isTouch && videoPoster);

  useLayoutEffect(() => {
    const video = videoRef.current;
    if (!video || !useLiveVideo) return;
    setVideoReady(false);

    // Reveal the live video only once it's actually showing the synced frame —
    // NOT on "canplay" alone. "canplay" can fire before our currentTime seek
    // (in syncVideoPlayback) has settled, which would swap the poster for a
    // frame-0 flash that then jumps to the correct time a moment later —
    // a visible flicker right at the card→hero handoff.
    if (videoTime > 0 && Number.isFinite(videoTime)) {
      const onSeeked = () => setVideoReady(true);
      video.addEventListener("seeked", onSeeked, { once: true });
      syncVideoPlayback(video, videoTime);
      return () => video.removeEventListener("seeked", onSeeked);
    }

    // No seek needed — the first decoded frame is already correct.
    const onCanPlay = () => setVideoReady(true);
    video.addEventListener("canplay", onCanPlay, { once: true });
    syncVideoPlayback(video, videoTime);
    return () => video.removeEventListener("canplay", onCanPlay);
  }, [useLiveVideo, videoTime, project.videoUrl]);

  return (
    <div
      className={`project-shared-flight-thumb relative overflow-hidden rounded-xl ${
        coverUrl ? "bg-bg-secondary" : "project-placeholder-gradient"
      }`}
      style={frameStyle(frame)}
    >
      {useLiveVideo ? (
        <>
          <video
            ref={videoRef}
            src={project.videoUrl}
            // Paints the captured frame from the video element itself, so a
            // freshly mounted (still undecoded) video is never black. The
            // overlay <img> below covers the same gap, but it has to decode
            // first — this closes the frame or two before that happens.
            poster={videoPoster}
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
          {!videoReady && videoPoster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={videoPoster}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              aria-hidden
            />
          )}
        </>
      ) : showVideo && videoPoster ? (
        // Frozen flight (touch): the captured tap-time frame, nothing to decode
        // eslint-disable-next-line @next/next/no-img-element
        <img src={videoPoster} alt="" className="h-full w-full object-cover" aria-hidden />
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
      style={{ ...frameStyle(frame), fontSize }}
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
      style={{ ...frameStyle(frame), fontSize }}
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
      style={frameStyle(frame)}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-full bg-chip text-chip-text ${
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
  videoTime,
  videoPoster,
  onLanding,
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
  const completedRef = useRef(false);
  const thumbRef = useRef<HTMLDivElement>(null);
  const onLandingRef = useRef(onLanding);
  onLandingRef.current = onLanding;

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const flightVideo = thumbRef.current?.querySelector<HTMLVideoElement>("video");
    const handoffVideoTime =
      showVideo && flightVideo ? flightVideo.currentTime : undefined;
    onLandingRef.current(handoffVideoTime);
  }, [showVideo]);

  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      onLandingRef.current();
      return;
    }

    completedRef.current = false;
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
      className={`project-shared-flight pointer-events-none fixed inset-0 z-[220] ${
        flight.direction === "close" ? "is-closing" : ""
      }`}
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
          videoTime={videoTime}
          videoPoster={videoPoster}
        />
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
