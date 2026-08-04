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
import { getWorkLoopStart } from "@/lib/workCarouselLoop";
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

/**
 * Odd number of copies so the viewport rests in the exact middle cycle. Two
 * cycles of slack on each side is all the loop needs: `enforceWorkLoopBounds`
 * wraps before the strip can run out, whatever the scroll speed. Keeping the
 * count low matters because opening a card snapshots every copy.
 */
const WORK_LOOP_COPIES = 5;

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
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-text-primary transition-colors hover:bg-bg-secondary/80 hover:text-text-primary disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-35 md:text-text-secondary md:hover:text-text-primary";

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
  const loopedProjects = useMemo(
    () =>
      Array.from({ length: WORK_LOOP_COPIES }, (_, copyIndex) =>
        projects.map((project) => ({
          project,
          copyIndex,
        })),
      ).flat(),
    [projects],
  );
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [cardOrigin, setCardOrigin] = useState<CardOrigin | null>(null);
  const [flight, setFlight] = useState<FlightPair | null>(null);
  const [sharedHiddenInstance, setSharedHiddenInstance] = useState<string | null>(null);
  const [activeInstanceId, setActiveInstanceId] = useState<string | null>(null);
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
  const activeInstanceRef = useRef<string | null>(null);
  const closedViaTransitionRef = useRef(false);
  const pinnedCardIndexRef = useRef<number | null>(null);
  const scrollSettleCleanupRef = useRef<(() => void) | null>(null);

  const pauseCarousel: CarouselPauseMode =
    phase === "open"
      ? "open"
      : phase === "closing" || phase === "opening"
        ? "flight"
        : false;

  const { scrollRef, setCardRef } = useWorkScrollFocus(
    loopedProjects.length,
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
        container.scrollTo({ left: getWorkLoopStart(container), behavior: "auto" });
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
  }, [scrollRef, loopedProjects.length, mode]);

  useEffect(() => {
    shouldAnchorStartRef.current = true;
    setActiveProject(null);
    setActiveIndex(0);
    pinnedCardIndexRef.current = null;
    scrollSettleCleanupRef.current?.();
    scrollSettleCleanupRef.current = null;
    flipCleanupRef.current?.();
    flipCleanupRef.current = null;
    document.documentElement.classList.remove("is-closing-flip", "modal-main-hidden");
    setPhase("idle");
    setCardOrigin(null);
    setFlight(null);
    setSharedHiddenInstance(null);
    setActiveInstanceId(null);
    setSharedContentVisible(false);
    setFlightShowVideo(false);
    setFlightVideoTime(0);
    carouselSnapshotRef.current = null;

    const container = scrollRef.current;
    if (container) {
      stopWorkCarouselMotion(container);
      container.scrollLeft = getWorkLoopStart(container);
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
      container.scrollTo({ left: getWorkLoopStart(container), behavior: "auto" });
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
  }, [scrollRef, mode, loopedProjects.length]);

  const carouselNavDisabled = activeProject !== null;

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
      if (nextIndex < 0 || nextIndex >= loopedProjects.length) return;

      pinnedCardIndexRef.current = nextIndex;
      scrollWorkCarouselToIndex(container, nextIndex);

      scrollSettleCleanupRef.current = whenWorkCarouselScrollSettles(container, () => {
        pinnedCardIndexRef.current = null;
        scrollSettleCleanupRef.current = null;
      });
    },
    [scrollRef, carouselNavDisabled, loopedProjects.length],
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
  activeInstanceRef.current = activeInstanceId;

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (phase === "open") {
      root.classList.add("modal-main-hidden");
    } else {
      root.classList.remove("modal-main-hidden");
    }
    // Clear close-transition classes when reaching idle so they're gone even
    // if we skipped the "closing" phase (e.g. measureRef returned null).
    if (phase === "idle") {
      root.classList.remove("is-closing-flip", "is-closing-prepare");
    }

    return () => {
      root.classList.remove("modal-main-hidden");
      // Remove close-transition classes when leaving "closing". This cleanup
      // runs after React's DOM mutations (modal already unmounted) but before
      // paint — guaranteeing the classes are gone before the next frame.
      if (phase === "closing") {
        root.classList.remove("is-closing-flip", "is-closing-prepare");
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
    setSharedHiddenInstance(null);
    setActiveInstanceId(null);
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
      // Fly back into the very copy that was opened, not merely a copy of the
      // same project that happens to sit nearest the scroll position.
      instanceId: activeInstanceRef.current ?? undefined,
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
    setActiveInstanceId(origin?.carouselInstanceId ?? null);

    if (!origin || prefersReducedMotion()) {
      setSharedContentVisible(true);
      setPhase("open");
      return;
    }

    const freshOrigin =
      measureCardOrigin(
        project.id,
        origin.showVideo,
        origin.carouselInstanceId,
      ) ?? origin;

    setCardOrigin(freshOrigin);
    setFlightShowVideo(freshOrigin.showVideo);
    setFlightVideoTime(freshOrigin.videoTime);
    setFlightVideoPoster(freshOrigin.videoPoster);
    setActiveInstanceId(freshOrigin.carouselInstanceId ?? null);
    setSharedHiddenInstance(freshOrigin.carouselInstanceId ?? null);
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
    setSharedHiddenInstance(null);
    setFlight(null);
  }, []);

  const requestClose = useCallback(() => {
    if (!activeProject || prefersReducedMotion()) {
      closeModal();
      return;
    }

    // Keep the opaque backdrop over the home page while we (1) hide modal
    // content, (2) snap the modal scroll to top for measurement, and (3) restore
    // the home/carousel scroll. is-closing-flip is applied only once the FLIP
    // is primed, so the first revealed home frame already has the flying
    // elements parked at the modal rects — no scroll-mismatch jump.
    const root = document.documentElement;
    root.classList.remove("modal-main-hidden");
    root.classList.add("is-closing-prepare");

    const modalTargets = measureRef.current?.();
    if (!modalTargets) {
      root.classList.remove("is-closing-prepare");
      closeModal();
      return;
    }

    closeTargetsRef.current = modalTargets;
    setSharedContentVisible(false);
    setSharedHiddenInstance(null);
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
    // Different project than the card we came from: let the close flight pick
    // the copy nearest the carousel instead of the stale one.
    setActiveInstanceId(null);
  };

  const registerMeasure = useCallback((fn: (() => ModalTargets | null) | null) => {
    measureRef.current = fn;
  }, []);

  return (
    <section
      id="projects"
      className="relative z-10"
      aria-label={t.projects}
    >
      <h2 className="sr-only">{t.projects}</h2>

      <div className="flex flex-col">
        <div className="order-2 mt-4 flex items-center gap-4 px-6 md:order-1 md:mb-3 md:mt-0 md:px-10">
          <WorkCarouselNav
            onPrev={() => scrollCarouselBy("prev")}
            onNext={() => scrollCarouselBy("next")}
            canGoPrev
            canGoNext
            prevLabel={t.prevProject}
            nextLabel={t.nextProject}
            disabled={carouselNavDisabled}
          />
        </div>

        <div className="relative order-1 md:order-2">
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
              data-work-loop-size={projects.length}
              data-work-loop-copies={WORK_LOOP_COPIES}
              className="work-scroll flex items-end gap-4 overflow-x-auto overflow-y-clip overscroll-x-contain scroll-pl-6 pb-12 pl-6 pt-0 md:gap-8 md:scroll-pl-10 md:pb-32 md:pl-10"
            >
              {loopedProjects.map(({ project, copyIndex }, index) => (
                <ProjectCard
                  key={`${copyIndex}-${project.id}`}
                  ref={setCardRef(index)}
                  project={project}
                  loopInstance={`${copyIndex}-${project.id}`}
                  onOpen={openProject}
                  // Scoped to the exact copy that was opened: matching on the
                  // project id alone would hide every copy of it and keep them
                  // all decoding video during the flight.
                  isSharedHidden={sharedHiddenInstance === `${copyIndex}-${project.id}`}
                  keepVideoAlive={
                    activeInstanceId === `${copyIndex}-${project.id}` &&
                    (sharedHiddenInstance !== null ||
                      phase === "opening" ||
                      phase === "closing")
                  }
                />
              ))}
              <EndScrollGutter width={endGutterWidth} />
            </div>
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
          backdropVisible={
            phase === "opening" || phase === "open" || phase === "closing"
          }
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
