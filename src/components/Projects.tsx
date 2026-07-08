"use client";

import { useState, useCallback, useRef, useLayoutEffect } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useWorkScrollFocus } from "@/hooks/useWorkScrollFocus";
import { translations } from "@/lib/i18n";
import { projects, type Project } from "@/lib/projects";
import {
  prefersReducedMotion,
  measureCardOrigin,
  type CardOrigin,
  type FlightPair,
  type ModalTargets,
} from "@/lib/motion";
import { getSavedScrollPosition, snapScrollTo } from "@/lib/scrollLock";
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
  const hadActiveProjectRef = useRef(false);
  const savedWorkScrollLeftRef = useRef(0);
  const phaseRef = useRef(phase);
  const cardOriginRef = useRef(cardOrigin);
  const activeProjectRef = useRef(activeProject);
  const { scrollRef, setCardRef } = useWorkScrollFocus(projects.length, !!activeProject);

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
  }, []);

  const closeModal = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActiveProject(null);
    resetTransition();
  }, [resetTransition]);

  const openProject = useCallback((project: Project, origin: CardOrigin | null) => {
    const index = projects.findIndex((p) => p.id === project.id);
    setActiveIndex(index);
    setActiveProject(project);

    if (!origin || prefersReducedMotion()) {
      setSharedContentVisible(true);
      setPhase("open");
      return;
    }

    const freshOrigin = measureCardOrigin(project.id, origin.showVideo) ?? origin;

    if (scrollRef.current) {
      savedWorkScrollLeftRef.current = scrollRef.current.scrollLeft;
    }

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

    const freshOrigin = measureCardOrigin(project.id, origin.showVideo) ?? origin;

    setFlight((current) => {
      if (current) return current;

      return {
        direction: "open",
        thumbnail: { from: freshOrigin.thumbnail, to: targets.thumbnail },
        title: {
          from: freshOrigin.title,
          to: targets.title,
          fromFontSize: freshOrigin.titleFontSize,
          toFontSize: targets.titleFontSize,
        },
      };
    });
    setSharedHiddenId(project.id);
  }, []);

  const handleFlightLanding = useCallback(() => {
    if (phaseRef.current === "opening") {
      setSharedContentVisible(true);
      setPhase("open");
    }
    if (phaseRef.current === "closing") {
      setSharedHiddenId(null);
    }
  }, []);

  const handleFlightComplete = useCallback(() => {
    setFlight(null);

    if (phaseRef.current === "opening") {
      setSharedHiddenId(null);
      setCardOrigin(null);
      return;
    }

    if (phaseRef.current === "closing") {
      closeModal();
    }
  }, [closeModal]);

  const requestClose = useCallback(() => {
    if (!activeProject || prefersReducedMotion()) {
      closeModal();
      return;
    }

    const modalTargets = measureRef.current?.();
    if (!modalTargets) {
      closeModal();
      return;
    }

    setPhase("closing");
    setSharedContentVisible(false);
    setSharedHiddenId(activeProject.id);

    const cardOriginAtClose = measureCardOrigin(activeProject.id, flightShowVideo);
    if (!cardOriginAtClose) {
      closeModal();
      return;
    }

    setFlight({
      direction: "close",
      thumbnail: {
        from: modalTargets.thumbnail,
        to: cardOriginAtClose.thumbnail,
      },
      title: {
        from: modalTargets.title,
        to: cardOriginAtClose.title,
        fromFontSize: modalTargets.titleFontSize,
        toFontSize: cardOriginAtClose.titleFontSize,
      },
    });
  }, [activeProject, closeModal, flightShowVideo]);

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
          showVideo={flightShowVideo}
          onLanding={handleFlightLanding}
          onComplete={handleFlightComplete}
        />
      )}
    </section>
  );
}
