"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useWorkScrollFocus } from "@/hooks/useWorkScrollFocus";
import { translations } from "@/lib/i18n";
import { projects, type Project } from "@/lib/projects";
import {
  prefersReducedMotion,
  measureCardOrigin,
  invertFlight,
  type CardOrigin,
  type FlightPair,
  type ModalTargets,
} from "@/lib/motion";
import { getSavedScrollPosition, snapScrollTo } from "@/lib/scrollLock";
import { FLAT_PERSPECTIVE } from "@/lib/workCardFocus";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";
import ProjectSharedFlight from "./ProjectSharedFlight";

function ScrollGutter() {
  return <div aria-hidden className="shrink-0 w-6 md:w-10" />;
}

type TransitionPhase = "idle" | "opening" | "open" | "closing";

export default function Projects() {
  const { locale } = useLocale();
  const t = translations[locale];
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [phase, setPhase] = useState<TransitionPhase>("idle");
  const [cardOrigin, setCardOrigin] = useState<CardOrigin | null>(null);
  const [flight, setFlight] = useState<FlightPair | null>(null);
  const [sharedHiddenId, setSharedHiddenId] = useState<string | null>(null);
  const [sharedContentVisible, setSharedContentVisible] = useState(false);
  const [flightShowVideo, setFlightShowVideo] = useState(false);
  const measureRef = useRef<(() => ModalTargets | null) | null>(null);
  const openFlightRef = useRef<FlightPair | null>(null);
  const prevPhaseRef = useRef<TransitionPhase>("idle");
  const hadActiveProjectRef = useRef(false);
  const savedWorkScrollLeftRef = useRef(0);
  const phaseRef = useRef(phase);
  const cardOriginRef = useRef(cardOrigin);
  const cardPerspectiveRef = useRef(cardOrigin?.perspective ?? FLAT_PERSPECTIVE);
  const activeProjectRef = useRef(activeProject);
  const pauseWorkFocus = phase === "open" || (phase === "opening" && flight !== null);
  const { scrollRef, setCardRef } = useWorkScrollFocus(projects.length, pauseWorkFocus);

  phaseRef.current = phase;
  cardOriginRef.current = cardOrigin;
  if (cardOrigin) {
    cardPerspectiveRef.current = cardOrigin.perspective;
  }
  activeProjectRef.current = activeProject;

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (phase === "open") {
      root.classList.add("modal-main-hidden");
    } else {
      root.classList.remove("modal-main-hidden");
    }

    return () => root.classList.remove("modal-main-hidden");
  }, [phase]);

  useLayoutEffect(() => {
    if (hadActiveProjectRef.current && !activeProject) {
      const { x, y } = getSavedScrollPosition();
      snapScrollTo(x, y);

      const container = scrollRef.current;
      if (container) {
        container.scrollLeft = savedWorkScrollLeftRef.current;
      }
    }

    hadActiveProjectRef.current = activeProject !== null;
  }, [activeProject, scrollRef]);

  const resetTransition = useCallback(() => {
    setPhase("idle");
    setCardOrigin(null);
    setFlight(null);
    setSharedHiddenId(null);
    setSharedContentVisible(false);
    setFlightShowVideo(false);
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
    const openFlight = openFlightRef.current;
    if (!project || !openFlight) {
      closeModal();
      return;
    }

    setFlight(invertFlight(openFlight));
  }, [phase, closeModal]);

  const openProject = useCallback((project: Project, origin: CardOrigin | null) => {
    const index = projects.findIndex((p) => p.id === project.id);

    if (scrollRef.current) {
      savedWorkScrollLeftRef.current = scrollRef.current.scrollLeft;
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
    setSharedContentVisible(false);
    setPhase("opening");
  }, [scrollRef]);

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
    setSharedHiddenId(project.id);
  }, []);

  const handleFlightLanding = useCallback(() => {
    if (phaseRef.current === "opening") {
      setSharedContentVisible(true);
      setPhase("open");
    }
  }, []);

  const handleFlightComplete = useCallback(() => {
    if (phaseRef.current === "closing") {
      setSharedHiddenId(null);
      setFlight(null);
      closeModal();
      return;
    }

    setFlight(null);

    if (phaseRef.current === "opening") {
      setSharedHiddenId(null);
    }
  }, [closeModal]);

  const requestClose = useCallback(() => {
    if (!activeProject || prefersReducedMotion()) {
      closeModal();
      return;
    }

    if (!openFlightRef.current) {
      closeModal();
      return;
    }

    setSharedContentVisible(false);
    setSharedHiddenId(activeProject.id);
    setPhase("closing");
  }, [activeProject, closeModal]);

  const navigate = (direction: "prev" | "next") => {
    const newIndex =
      direction === "next"
        ? (activeIndex + 1) % projects.length
        : (activeIndex - 1 + projects.length) % projects.length;
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
            className="work-scroll flex items-end gap-6 overflow-x-auto overflow-y-visible overscroll-x-contain px-0 pb-12 pt-0 md:gap-10 md:pb-14"
          >
            <ScrollGutter />
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                ref={setCardRef(index)}
                project={project}
                onOpen={openProject}
                isSharedHidden={sharedHiddenId === project.id}
              />
            ))}
            <ScrollGutter />
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
          onFlightTargetsReady={handleFlightTargetsReady}
          onRegisterMeasure={registerMeasure}
        />
      )}

      {activeProject && flight && (
        <ProjectSharedFlight
          project={activeProject}
          locale={locale}
          flight={flight}
          cardPerspective={cardPerspectiveRef.current}
          showVideo={flightShowVideo}
          onLanding={handleFlightLanding}
          onComplete={handleFlightComplete}
        />
      )}
    </section>
  );
}
