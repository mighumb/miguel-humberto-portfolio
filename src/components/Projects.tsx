"use client";

import { useState, useCallback, useRef } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { useWorkScrollFocus } from "@/hooks/useWorkScrollFocus";
import { translations } from "@/lib/i18n";
import { projects, type Project } from "@/lib/projects";
import {
  prefersReducedMotion,
  type CardOrigin,
  type FlightPair,
  type ModalTargets,
} from "@/lib/motion";
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
  const { scrollRef, setCardRef } = useWorkScrollFocus(projects.length, !!activeProject);

  const resetTransition = useCallback(() => {
    setPhase("idle");
    setCardOrigin(null);
    setFlight(null);
    setSharedHiddenId(null);
    setSharedContentVisible(false);
    setFlightShowVideo(false);
  }, []);

  const closeModal = useCallback(() => {
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

    setCardOrigin(origin);
    setFlightShowVideo(origin.showVideo);
    setSharedHiddenId(project.id);
    setSharedContentVisible(false);
    setPhase("opening");
  }, []);

  const handleFlightTargetsReady = useCallback(
    (targets: ModalTargets) => {
      if (phase !== "opening" || !cardOrigin) return;

      setFlight((current) => {
        if (current) return current;

        return {
          direction: "open",
          thumbnail: { from: cardOrigin.thumbnail, to: targets.thumbnail },
          title: {
            from: cardOrigin.title,
            to: targets.title,
            fromFontSize: cardOrigin.titleFontSize,
            toFontSize: targets.titleFontSize,
          },
        };
      });
    },
    [phase, cardOrigin],
  );

  const handleFlightComplete = useCallback(() => {
    if (phase === "opening") {
      setSharedContentVisible(true);
      setFlight(null);
      setPhase("open");
      setSharedHiddenId(null);
      setCardOrigin(null);
      return;
    }

    if (phase === "closing") {
      closeModal();
    }
  }, [phase, closeModal]);

  const requestClose = useCallback(() => {
    if (!activeProject || prefersReducedMotion()) {
      closeModal();
      return;
    }

    const modalTargets = measureRef.current?.();
    const card = document.querySelector(`[data-project-id="${activeProject.id}"]`);
    const visual = card?.querySelector<HTMLElement>(".work-card-visual");
    const title = card?.querySelector<HTMLElement>(".work-card-title");

    if (!modalTargets || !visual || !title) {
      closeModal();
      return;
    }

    setSharedContentVisible(false);
    setSharedHiddenId(activeProject.id);
    setPhase("closing");
    setFlight({
      direction: "close",
      thumbnail: {
        from: modalTargets.thumbnail,
        to: {
          top: visual.getBoundingClientRect().top,
          left: visual.getBoundingClientRect().left,
          width: visual.getBoundingClientRect().width,
          height: visual.getBoundingClientRect().height,
        },
      },
      title: {
        from: modalTargets.title,
        to: {
          top: title.getBoundingClientRect().top,
          left: title.getBoundingClientRect().left,
          width: title.getBoundingClientRect().width,
          height: title.getBoundingClientRect().height,
        },
        fromFontSize: modalTargets.titleFontSize,
        toFontSize: getComputedStyle(title).fontSize,
      },
    });
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
          showVideo={flightShowVideo}
          onComplete={handleFlightComplete}
        />
      )}
    </section>
  );
}
