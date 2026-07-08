"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import { projects, type Project } from "@/lib/projects";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";

function ScrollGutter() {
  return <div aria-hidden className="shrink-0 w-6 md:w-10" />;
}

export default function Projects() {
  const { locale } = useLocale();
  const t = translations[locale];
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const openProject = (project: Project) => {
    const index = projects.findIndex((p) => p.id === project.id);
    setActiveIndex(index);
    setActiveProject(project);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setActiveProject(null);
    document.body.style.overflow = "";
  };

  const navigate = (direction: "prev" | "next") => {
    const newIndex =
      direction === "next"
        ? (activeIndex + 1) % projects.length
        : (activeIndex - 1 + projects.length) % projects.length;
    setActiveIndex(newIndex);
    setActiveProject(projects[newIndex]);
  };

  return (
    <section id="projects" className="pb-24 md:pb-32">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <h2 className="text-3xl font-light tracking-tight text-text-primary md:text-5xl">
          {t.projects}
        </h2>
      </div>

      <div className="relative mt-12 md:mt-16">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-bg-primary to-transparent md:w-12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-bg-primary to-transparent md:w-12"
          aria-hidden
        />

        <div className="work-scroll flex items-start gap-5 overflow-x-auto overscroll-x-contain pb-4 snap-x snap-proximity scroll-smooth md:gap-8">
          <ScrollGutter />
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              onOpen={openProject}
            />
          ))}
          <ScrollGutter />
        </div>
      </div>

      {activeProject && (
        <ProjectModal
          project={activeProject}
          onClose={closeModal}
          onPrev={() => navigate("prev")}
          onNext={() => navigate("next")}
          currentIndex={activeIndex}
          total={projects.length}
        />
      )}
    </section>
  );
}
