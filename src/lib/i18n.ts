export type Locale = "en" | "fr";

export const translations = {
  en: {
    modes: {
      ai: {
        role: "AI Creative Designer",
        tagline:
          "I design distinctive digital experiences for brands, connecting art and technology.",
      },
      craft: {
        role: "AI Creative Designer",
        tagline:
          "I design distinctive digital experiences for brands, connecting art and technology.",
      },
    },
    role: "AI Creative Designer",
    tagline:
      "I design distinctive digital experiences for brands, connecting art and technology.",
    scrollHint: "Scroll to explore",
    projects: "Work",
    prevProject: "Previous project",
    nextProject: "Next project",
    viewProject: "View project",
    manifestoTitle: "Who I am",
    manifesto: [
      "Curious and mostly self-taught. I've built my craft across design, motion, 3D, and UI, project by project.",
      "I'm meticulous with the finish, always exploring in the process. I test new tools, compare workflows, and give ideas the time they need to go somewhere less obvious.",
      "I've learned this: people who combine craft and AI aren't replaced, they raise the bar. That's how I work today, across brands, labels, and platforms.",
    ],
    contactTitle: "Let's work together",
    contactSubtitle: "Open to collaborations, freelance projects, and creative roles.",
    email: "miguelhumberto.pro@gmail.com",
    linkedin: "LinkedIn",
    cvSoon: "CV, coming soon",
    modal: {
      context: "Context",
      deliverables: "Deliverables",
      process: "Process",
      tools: "Tools",
      links: "Links & Resources",
      contextPlaceholder:
        "Brief placeholder — describe the project objective, audience, and constraints in two or three sentences.",
      steps: ["Explore & Research", "Prompt & Prototype", "Produce & Refine", "Share & Document"],
      stepDescriptions: [
        "Trend research, model testing, and creative direction exploration.",
        "Iterative prompting, workflow prototyping, and visual references.",
        "Generation, post-production, sound design, and quality control.",
        "Publication, documentation, and community feedback.",
      ],
      notion: "Notion Documentation",
      youtube: "YouTube",
      instagram: "Instagram",
      tiktok: "TikTok",
      figma: "Figma File",
      template: "Get template",
      viewOnLinkedin: "View on LinkedIn",
    },
    header: {
      contact: "Contact",
    },
  },
  fr: {
    modes: {
      ai: {
        role: "AI Creative Designer",
        tagline:
          "Je conçois des expériences digitales distinctives pour les marques, en reliant l'art et la technologie.",
      },
      craft: {
        role: "AI Creative Designer",
        tagline:
          "Je conçois des expériences digitales distinctives pour les marques, en reliant l'art et la technologie.",
      },
    },
    role: "AI Creative Designer",
    tagline:
      "Je conçois des expériences digitales distinctives pour les marques, en reliant l'art et la technologie.",
    scrollHint: "Défiler pour explorer",
    projects: "Projets",
    prevProject: "Projet précédent",
    nextProject: "Projet suivant",
    viewProject: "Voir le projet",
    manifestoTitle: "Qui je suis",
    manifesto: [
      "Curieux et en grande partie autodidacte. J'ai construit mon savoir-faire entre le design, le motion, la 3D et l'UI, projet après projet.",
      "Méticuleux sur la finition, curieux sur la méthode. Je teste, je compare, et je laisse aux idées le temps d'aller vers quelque chose de moins évident.",
      "J'ai appris ceci : les personnes qui allient craft et IA ne sont pas remplacées, elles élèvent le niveau. C'est comme ça que je travaille aujourd'hui, pour des marques, des labels et des plateformes.",
    ],
    contactTitle: "Travaillons ensemble",
    contactSubtitle: "Ouvert aux collaborations, projets freelance et rôles créatifs.",
    email: "miguelhumberto.pro@gmail.com",
    linkedin: "LinkedIn",
    cvSoon: "CV, bientôt disponible",
    modal: {
      context: "Contexte",
      deliverables: "Livrables",
      process: "Processus",
      tools: "Outils",
      links: "Liens & Ressources",
      contextPlaceholder:
        "Placeholder — décrivez l'objectif du projet, l'audience et les contraintes en deux ou trois phrases.",
      steps: ["Explorer & Rechercher", "Prompt & Prototype", "Produire & Affiner", "Partager & Documenter"],
      stepDescriptions: [
        "Veille, tests de modèles et exploration de la direction créative.",
        "Itérations de prompts, prototypage de workflows et références visuelles.",
        "Génération, post-production, sound design et contrôle qualité.",
        "Publication, documentation et retours de la communauté.",
      ],
      notion: "Documentation Notion",
      youtube: "YouTube",
      instagram: "Instagram",
      tiktok: "TikTok",
      figma: "Fichier Figma",
      template: "Obtenir le template",
      viewOnLinkedin: "Voir sur LinkedIn",
    },
    header: {
      contact: "Contact",
    },
  },
} as const;

export type TranslationKey = typeof translations.en;
