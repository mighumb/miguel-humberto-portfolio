"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import SiteNav from "@/components/SiteNav";
import ContactModal from "@/components/ContactModal";
import TransitionOverlay from "@/components/portfolio/TransitionOverlay";
import ProjectDetailModal from "@/components/portfolio/ProjectDetailModal";
import type { PortfolioTrack, PortfolioView } from "@/lib/portfolioTypes";
import type { Project } from "@/lib/projects";
import { projectsForTrack } from "@/lib/projects";

const StudioCanvas = dynamic(() => import("@/components/portfolio/StudioCanvas"), {
  ssr: false,
  loading: () => <div className="portfolio-canvas-fallback h-full w-full bg-[#f0f0f3]" />,
});

const ENTER_MS = 900;
const SWITCH_MS = 900;

export default function PortfolioExperience() {
  const [view, setView] = useState<PortfolioView>("home");
  const [activeTrack, setActiveTrack] = useState<PortfolioTrack | null>(null);
  const [transitionActive, setTransitionActive] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projectIndex, setProjectIndex] = useState(0);
  const carouselAngle = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const timers = useRef<number[]>([]);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  useEffect(() => () => clearTimers(), []);

  const goHome = useCallback(() => {
    clearTimers();
    setTransitionActive(false);
    setActiveProject(null);
    setContactOpen(false);
    setView("home");
    setActiveTrack(null);
    carouselAngle.current = 0;
  }, []);

  const goBack = useCallback(() => {
    if (activeProject) {
      setActiveProject(null);
      return;
    }
    goHome();
  }, [activeProject, goHome]);

  const enterTrack = useCallback((track: PortfolioTrack, mode: "entering" | "switching") => {
    clearTimers();
    setActiveProject(null);
    setActiveTrack(track);
    setView(mode);
    setTransitionActive(true);
    carouselAngle.current = 0;

    const duration = mode === "switching" ? SWITCH_MS : ENTER_MS;
    timers.current.push(
      window.setTimeout(() => {
        setTransitionActive(false);
        setView("carousel");
      }, duration),
    );
  }, []);

  const onSelectTrack = useCallback(
    (track: PortfolioTrack) => {
      if (view === "entering" || view === "switching") return;

      if (view === "carousel" && activeTrack && track !== activeTrack) {
        enterTrack(track, "switching");
        return;
      }

      if (view === "home") {
        enterTrack(track, "entering");
      }
    },
    [view, activeTrack, enterTrack],
  );

  const onOpenProject = useCallback(
    (project: Project) => {
      if (view !== "carousel") return;
      const list = projectsForTrack(project.track);
      const index = list.findIndex((item) => item.id === project.id);
      setProjectIndex(Math.max(0, index));
      setActiveProject(project);
    },
    [view],
  );

  const navigateProject = useCallback(
    (direction: "prev" | "next") => {
      if (!activeTrack || !activeProject) return;
      const list = projectsForTrack(activeTrack);
      if (!list.length) return;
      const nextIndex =
        direction === "next"
          ? (projectIndex + 1) % list.length
          : (projectIndex - 1 + list.length) % list.length;
      setProjectIndex(nextIndex);
      setActiveProject(list[nextIndex]);
    },
    [activeTrack, activeProject, projectIndex],
  );

  useEffect(() => {
    if (view !== "carousel" || activeProject || contactOpen) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      carouselAngle.current += event.deltaY * 0.0018;
    };

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchStartX.current = event.touches[0].clientX;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (touchStartX.current === null || event.touches.length !== 1) return;
      const x = event.touches[0].clientX;
      const delta = x - touchStartX.current;
      touchStartX.current = x;
      carouselAngle.current += delta * 0.0045;
    };

    const onTouchEnd = () => {
      touchStartX.current = null;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [view, activeProject, contactOpen]);

  const tint = activeTrack ?? "ai";

  return (
    <div className="portfolio-experience relative h-[100dvh] w-full overflow-hidden bg-[#f0f0f3]">
      <SiteNav
        onHome={goHome}
        onContact={() => setContactOpen(true)}
        showBack={view !== "home"}
        onBack={goBack}
      />

      <div className="absolute inset-0">
        <StudioCanvas
          view={view}
          activeTrack={activeTrack}
          carouselAngle={carouselAngle}
          onSelectTrack={onSelectTrack}
          onOpenProject={onOpenProject}
        />
      </div>

      <TransitionOverlay active={transitionActive} tint={tint} />

      {contactOpen && <ContactModal onClose={() => setContactOpen(false)} />}

      {activeProject && activeTrack && (
        <ProjectDetailModal
          project={activeProject}
          currentIndex={projectIndex}
          total={projectsForTrack(activeTrack).length}
          onClose={() => setActiveProject(null)}
          onPrev={() => navigateProject("prev")}
          onNext={() => navigateProject("next")}
        />
      )}
    </div>
  );
}
