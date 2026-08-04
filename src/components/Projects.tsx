"use client";

import { useState, useCallback, useRef, useLayoutEffect, useMemo, useEffect, type RefObject } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useWorkScrollFocus, type CarouselPauseMode } from "@/hooks/useWorkScrollFocus";
import { translations } from "@/lib/i18n";
import { projectsForTrack, type Project } from "@/lib/projects";
import {
  getFocusedWorkCardIndex,
  getWorkCarouselEndGutterWidth,
  scrollWorkCarouselToIndex,
  whenWorkCarouselScrollSettles,
} from "@/lib/workCarouselNav";
import { stopWorkCarouselMotion } from "@/lib/workDragScroll";
import {
  prefersReducedMotion,
  measureCardOrigin,
  type CardOrigin,
  type CardPerspective,
  type FlightPair,
  type ModalTargets,
} from "@/lib/motion";
import { getSavedScrollPosition, snapScrollTo } from "@/lib/scrollLock";
import {
  captureCardPerspectives,
  restoreCardPerspectives,
} from "@/lib/workCardFocus";
import { runFlipClose } from "@/lib/flipClose";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import ProjectSharedFlight from "./ProjectSharedFlight";

function EndScrollGutter({ width }: { width: number }) {
  return (
    <div
      aria-hidden
      data-work-gutter="end"
      className="work-scroll-end-gutter shrink-0"
      style={{ width, overflowAnchor: "none" }}
    />
  );
}

function WorkCarouselNav({
  onPrev,
  onNext,
  canGoPrev,
  canGoNext,
  prevLabel,
  nextLabel,
  disabled,
}: {
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
  prevLabel: string;
  nextLabel: string;
  disabled?: boolean;
}) {
  const buttonClass =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-35";

  return (
    <div className="flex items-center gap-2" aria-label="Carousel navigation">
      <button
        type="button"
        onClick={onPrev}
        disabled={disabled || !canGoPrev}
        className={buttonClass}
        aria-label={prevLabel}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M11 3L5 9l6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={disabled || !canGoNext}
        className={buttonClass}
        aria-label={nextLabel}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
          <path
            d="M7 3l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}

type TransitionPhase = "idle" | "opening" | "open" | "closing";

function restoreWorkScroll(
  scrollRef: RefObject<HTMLDivElement | null>,
  savedWorkScrollLeft: number,
) {
  const { x, y } = getSavedScrollPosition();
  snapScrollTo(x, y);

  const container = scrollRef.current;
  if (container) {
    container.scrollLeft = savedWorkScrollLeft;
  }
}

function restoreFrozenCarousel(
  scrollRef: RefObject<HTMLDivElement | null>,
  savedWorkScrollLeft: number,
  snapshot: Map<string, CardPerspective> | null,
) {
  restoreWorkScroll(scrollRef, savedWorkScrollLeft);

  const container = scrollRef.current;
  if (container && snapshot) {
    restoreCardPerspectives(container, snapshot);
  }
}

export default function Projects() {
  const { locale } = useLocale();
  const { mode } = useTheme();
  const t = translations[locale];
  const projects = useMemo(() => projectsForTrack(mode), [mode]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [cardOrigin, setCardOrigin] = useState<CardOrigin | null>(null);
  const [flight, setFlight] = useState<FlightPair | null>(null);
  const [sharedHiddenId, setSharedHiddenId] = useState<string | null>(null);
  const [sharedContentVisible, setSharedContentVisible] = useState(false);
  const [flightShowVideo, setFlightShowVideo] = useState(false);
  const [flightVideoTime, setFlightVideoTime] = useState(0);
  const [flightVideoPoster, setFlightVideoPoster] = useState<string | undefined>(undefined);
  const measureRef = useRef<(() => ModalTargets | null) | null>(null);
  const closeTargetsRef = useRef<ModalTargets | null>(null);
  const flipCleanupRef = useRef<(() => void) | null>(null);
  const openFlightRef = useRef<FlightPair | null>(null);
  const prevPhaseRef = useRef<TransitionPhase>("idle");
  const hadActiveProjectRef = useRef(false);
  const savedWorkScrollLeftRef = useRef(0);
  const carouselSnapshotRef = useRef<Map<string, CardPerspective> | null>(null);
  const phaseRef = useRef(phase);
  const cardOriginRef = useRef(cardOrigin);
  const activeProjectRef = useRef(activeProject);
  const closedViaTransitionRef = useRef(false);
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);
  const pinnedCardIndexRef = useRef<number | null>(null);
  const scrollSettleCleanupRef = useRef<(() => void) | null>(null);
  const scrollSettleTimerRef = useRef(0);

  const pauseCarousel: CarouselPauseMode =
    phase === "open"
      ? "open"
      : phase === "closing" || phase === "opening"
        ? "flight"
        : false;

  const { scrollRef, setCardRef } = useWorkScrollFocus(
    projects.length,
    pauseCarousel,
    carouselSnapshotRef,
  );
  const [endGutterWidth, setEndGutterWidth] = useState(24);
  const shouldAnchorStartRef = useRef(true);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateEndGutter = () => {
      const nextWidth = getWorkCarouselEndGutterWidth(container);
      setEndGutterWidth((prev) => (prev === nextWidth ? prev : nextWidth));

      // Keep the first card flush left after layout/gutter measurement settles.
      if (shouldAnchorStartRef.current && pinnedCardIndexRef.current === null) {
        stopWorkCarouselMotion(container);
        container.scrollTo({ left: 0, behavior: "auto" });
        setFocusedCardIndex(0);
      }
    };

    updateEndGutter();

    const observer = new ResizeObserver(updateEndGutter);
    observer.observe(container);
    container
      .querySelectorAll<HTMLElement>("[data-project-id]")
      .forEach((card) => observer.observe(card));
    window.addEventListener("resize", updateEndGutter);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateEndGutter);
    };
  }, [scrollRef, projects.length, mode]);

  useEffect(() => {
    shouldAnchorStartRef.current = true;
    setActiveProject(null);
    setActiveIndex(0);
    setFocusedCardIndex(0);
    pinnedCardIndexRef.current = null;
    scrollSettleCleanupRef.current?.();
    scrollSettleCleanupRef.current = null;
    flipCleanupRef.current?.();
    flipCleanupRef.current = null;
    document.documentElement.classList.remove("is-closing-flip", "modal-main-hidden");
    setPhase("idle");
    setCardOrigin(null);
    setFlight(null);
    setSharedHiddenId(null);
    setSharedContentVisible(false);
    setFlightShowVideo(false);
    setFlightVideoTime(0);
    carouselSnapshotRef.current = null;

    const container = scrollRef.current;
    if (container) {
      stopWorkCarouselMotion(container);
      container.scrollLeft = 0;
    }
  }, [mode, scrollRef]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const releaseAnchor = () => {
      shouldAnchorStartRef.current = false;
    };

    // User interaction ends start-anchoring; ignore programmatic scrollLeft=0.
    container.addEventListener("pointerdown", releaseAnchor, { passive: true });

    // Re-assert left start after Safari layout / scroll-anchoring settles.
    const anchorStart = () => {
      if (!shouldAnchorStartRef.current) return;
      stopWorkCarouselMotion(container);
      container.scrollTo({ left: 0, behavior: "auto" });
    };
    const raf1 = window.requestAnimationFrame(() => {
      anchorStart();
      window.requestAnimationFrame(anchorStart);
    });
    const timer = window.setTimeout(() => {
      anchorStart();
      releaseAnchor();
    }, 800);

    return () => {
      container.removeEventListener("pointerdown", releaseAnchor);
      window.cancelAnimationFrame(raf1);
      window.clearTimeout(timer);
    };
  }, [scrollRef, mode, projects.length]);

  const carouselNavDisabled = activeProject !== null;

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const updateFocusedIndex = () => {
      if (pinnedCardIndexRef.current !== null) return;

      window.clearTimeout(scrollSettleTimerRef.current);
      scrollSettleTimerRef.current = window.setTimeout(() => {
        setFocusedCardIndex(getFocusedWorkCardIndex(container));
      }, 120);
    };

    updateFocusedIndex();
    container.addEventListener("scroll", updateFocusedIndex, { passive: true });
    window.addEventListener("resize", updateFocusedIndex);

    return () => {
      window.clearTimeout(scrollSettleTimerRef.current);
      container.removeEventListener("scroll", updateFocusedIndex);
      window.removeEventListener("resize", updateFocusedIndex);
    };
  }, [scrollRef, projects.length, pauseCarousel]);

  const scrollCarouselBy = useCallback(
    (direction: "prev" | "next") => {
      const container = scrollRef.current;
      if (!container || carouselNavDisabled) return;

      stopWorkCarouselMotion(container);
      scrollSettleCleanupRef.current?.();
      scrollSettleCleanupRef.current = null;

      const currentIndex =
        pinnedCardIndexRef.current ?? getFocusedWorkCardIndex(container);
      const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= projects.length) return;

      pinnedCardIndexRef.current = nextIndex;
      setFocusedCardIndex(nextIndex);
      scrollWorkCarouselToIndex(container, nextIndex);

      scrollSettleCleanupRef.current = whenWorkCarouselScrollSettles(container, () => {
        pinnedCardIndexRef.current = null;
        scrollSettleCleanupRef.current = null;
        setFocusedCardIndex(getFocusedWorkCardIndex(container));
      });
    },
    [scrollRef, carouselNavDisabled],
  );

  useLayoutEffect(
    () => () => {
      scrollSettleCleanupRef.current?.();
      scrollSettleCleanupRef.current = null;
      pinnedCardIndexRef.current = null;
    },
    [],
  );

  phaseRef.current = phase;
  cardOriginRef.current = cardOrigin;
  activeProjectRef.current = activeProject;

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (phase === "open") {
      root.classList.add("modal-main-hidden");
    } else {
      root.classList.remove("modal-main-hidden");
    }
    // Remove is-closing-flip when reaching idle so it's cleared even if we
    // skipped the "closing" phase (e.g. measureRef returned null).
    if (phase === "idle") {
      root.classList.remove("is-closing-flip");
    }

    return () => {
      root.classList.remove("modal-main-hidden");
      // Remove is-closing-flip when leaving "closing". This cleanup runs
      // after React's DOM mutations (modal already unmounted) but before
      // paint — guaranteeing the class is gone before the next frame.
      if (phase === "closing") {
        root.classList.remove("is-closing-flip");
      }
    };
  }, [phase]);

  useLayoutEffect(() => {
    if (closedViaTransitionRef.current) {
      closedViaTransitionRef.current = false;
      hadActiveProjectRef.current = false;
      return;
    }

    if (hadActiveProjectRef.current && !activeProject) {
      restoreFrozenCarousel(
        scrollRef,
        savedWorkScrollLeftRef.current,
        carouselSnapshotRef.current,
      );
    }

    hadActiveProjectRef.current = activeProject !== null;
  }, [activeProject, scrollRef]);

  const resetTransition = useCallback(() => {
    flipCleanupRef.current?.();
    flipCleanupRef.current = null;
    // is-closing-flip is removed by the useLayoutEffect for [phase] when phase
    // transitions from "closing" → "idle". That cleanup runs after React's DOM
    // mutations (modal already unmounted) but before paint, which is the only
    // safe window. A requestAnimationFrame here would fire BEFORE React commits
    // (React uses MessageChannel, which runs after rAFs), briefly re-showing
    // the modal header between the rAF and the commit.
    setPhase("idle");
    setCardOrigin(null);
    setFlight(null);
    setSharedHiddenId(null);
    setSharedContentVisible(false);
    setFlightShowVideo(false);
    setFlightVideoTime(0);
    closeTargetsRef.current = null;
    openFlightRef.current = null;
  }, []);

  const closeModal = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActiveProject(null);
    resetTransition();
  }, [resetTransition]);

  useLayoutEffect(() => {
    const enteredClosing = phase === "closing" && prevPhaseRef.current !== "closing";
    prevPhaseRef.current = phase;
    if (!enteredClosing) return;

    const project = activeProjectRef.current;
    const modalTargets = closeTargetsRef.current;
    const snapshot = carouselSnapshotRef.current;
    if (!project || !modalTargets || !snapshot) {
      closeModal();
      return;
    }

    restoreFrozenCarousel(scrollRef, savedWorkScrollLeftRef.current, snapshot);

    flipCleanupRef.current?.();
    flipCleanupRef.current = runFlipClose({
      projectId: project.id,
      modalTargets,
      onComplete: () => {
        restoreFrozenCarousel(
          scrollRef,
          savedWorkScrollLeftRef.current,
          carouselSnapshotRef.current,
        );

        closedViaTransitionRef.current = true;
        flipCleanupRef.current = null;
        closeModal();
      },
    });

    return () => {
      flipCleanupRef.current?.();
      flipCleanupRef.current = null;
    };
  }, [phase, closeModal, scrollRef]);

  const openProject = useCallback((project: Project, origin: CardOrigin | null) => {
    const index = projects.findIndex((p) => p.id === project.id);

    if (scrollRef.current) {
      savedWorkScrollLeftRef.current = scrollRef.current.scrollLeft;
      carouselSnapshotRef.current = captureCardPerspectives(scrollRef.current);
    }

    setActiveIndex(index);
    setActiveProject(project);

    if (!origin || prefersReducedMotion()) {
      setSharedContentVisible(true);
      setPhase("open");
      return;
    }

    const freshOrigin = measureCardOrigin(project.id, origin.showVideo) ?? origin;

    setCardOrigin(freshOrigin);
    setFlightShowVideo(freshOrigin.showVideo);
    setFlightVideoTime(freshOrigin.videoTime);
    setFlightVideoPoster(freshOrigin.videoPoster);
    setSharedHiddenId(project.id);
    setSharedContentVisible(false);
    setPhase("opening");
  }, [scrollRef, projects]);

  const handleFlightTargetsReady = useCallback((targets: ModalTargets) => {
    if (phaseRef.current !== "opening") return;

    const project = activeProjectRef.current;
    const origin = cardOriginRef.current;
    if (!project || !origin) return;

    const nextFlight: FlightPair = {
      direction: "open",
      thumbnail: { from: origin.thumbnail, to: targets.thumbnail },
      title: {
        from: origin.title,
        to: targets.title,
        fromFontSize: origin.titleFontSize,
        toFontSize: targets.titleFontSize,
      },
      year: {
        from: origin.year,
        to: targets.year,
        fromFontSize: origin.yearFontSize,
        toFontSize: targets.yearFontSize,
      },
      tags: { from: origin.tags, to: targets.tags },
    };

    openFlightRef.current = nextFlight;
    setFlight(nextFlight);
  }, []);

  const handleFlightLanding = useCallback((handoffVideoTime?: number) => {
    if (phaseRef.current !== "opening") return;

    if (handoffVideoTime !== undefined) {
      setFlightVideoTime(handoffVideoTime);
    }
    setSharedContentVisible(true);
    setPhase("open");
    setSharedHiddenId(null);
    setFlight(null);
  }, []);

  const requestClose = useCallback(() => {
    if (!activeProject || prefersReducedMotion()) {
      closeModal();
      return;
    }

    // Hide the modal before measuring so neither the modal-header background
    // nor a scroll-to-top flash is ever painted. getBoundingClientRect still
    // returns correct layout positions with visibility:hidden.
    document.documentElement.classList.remove("modal-main-hidden");
    document.documentElement.classList.add("is-closing-flip");

    const modalTargets = measureRef.current?.();
    if (!modalTargets) {
      closeModal();
      return;
    }

    closeTargetsRef.current = modalTargets;
    setSharedContentVisible(false);
    setSharedHiddenId(null);
    setPhase("closing");
  }, [activeProject, closeModal]);

  const navigate = (direction: "prev" | "next") => {
    const newIndex =
      direction === "next"
        ? (activeIndex + 1) % projects.length
        : (activeIndex - 1 + projects.length) % projects.length;
    setFlightShowVideo(false);
    setFlightVideoTime(0);
    setActiveIndex(newIndex);
    setActiveProject(projects[newIndex]);
  };

  const registerMeasure = useCallback((fn: (() => ModalTargets | null) | null) => {
    measureRef.current = fn;
  }, []);

  return (
    <section
      id="projects"
      className="relative z-10 pb-8 md:pb-10"
      aria-label={t.projects}
    >
      <h2 className="sr-only">{t.projects}</h2>

      <div className="mb-2 flex items-center gap-4 px-6 md:mb-3 md:px-10">
        <span className="text-xs tracking-widest text-text-secondary uppercase tabular-nums">
          {String(focusedCardIndex + 1).padStart(2, "0")} /{" "}
          {String(projects.length).padStart(2, "0")}
        </span>
        <WorkCarouselNav
          onPrev={() => scrollCarouselBy("prev")}
          onNext={() => scrollCarouselBy("next")}
          canGoPrev={focusedCardIndex > 0}
          canGoNext={focusedCardIndex < projects.length - 1}
          prevLabel={t.prevProject}
          nextLabel={t.nextProject}
          disabled={carouselNavDisabled}
        />
      </div>

      <div className="relative">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-bg-primary to-transparent md:w-12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-bg-primary to-transparent md:w-12"
          aria-hidden
        />

        <div className="work-scroll-stage relative">
          <div
            ref={scrollRef}
            dir="ltr"
            className="work-scroll flex items-end gap-6 overflow-x-auto overflow-y-visible overscroll-x-contain scroll-pl-6 pb-12 pl-6 pt-0 md:gap-10 md:scroll-pl-10 md:pb-14 md:pl-10"
          >
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                ref={setCardRef(index)}
                project={project}
                onOpen={openProject}
                isSharedHidden={sharedHiddenId === project.id}
                keepVideoAlive={
                  sharedHiddenId === project.id ||
                  (activeProject?.id === project.id &&
                    (phase === "opening" || phase === "closing"))
                }
              />
            ))}
            <EndScrollGutter width={endGutterWidth} />
          </div>
        </div>
      </div>

      {activeProject && (
        <ProjectModal
          project={activeProject}
          onRequestClose={requestClose}
          onPrev={() => navigate("prev")}
          onNext={() => navigate("next")}
          currentIndex={activeIndex}
          total={projects.length}
          sharedContentVisible={sharedContentVisible}
          awaitingFlightTargets={phase === "opening"}
          backdropVisible={phase === "opening" || phase === "open"}
          videoPlaying={flightShowVideo}
          videoTime={flightVideoTime}
          videoPoster={flightVideoPoster}
          onFlightTargetsReady={handleFlightTargetsReady}
          onRegisterMeasure={registerMeasure}
        />
      )}

      {activeProject && flight?.direction === "open" && (
        <ProjectSharedFlight
          project={activeProject}
          locale={locale}
          flight={flight}
          showVideo={flightShowVideo}
          videoTime={flightVideoTime}
          videoPoster={flightVideoPoster}
          onLanding={handleFlightLanding}
        />
      )}
    </section>
  );
}
