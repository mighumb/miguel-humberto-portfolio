"use client";

import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { translations } from "@/lib/i18n";
import { projects, type Project } from "@/lib/projects";
import ProjectCard from "./ProjectCard";
import ProjectModal from "./ProjectModal";

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
    <section id="projects" className="mx-auto max-w-7xl px-6 py-24 md:px-10 md:py-32">
      <div className="mb-16 md:mb-24">
        <p className="mb-3 text-sm font-medium tracking-[0.2em] text-text-secondary uppercase">
          01
        </p>
        <h2 className="text-3xl font-light tracking-tight text-text-primary md:text-5xl">
          {t.projects}
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-x-10 gap-y-16 md:grid-cols-2 md:gap-y-20">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={index}
            onOpen={openProject}
          />
        ))}
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
