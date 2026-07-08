export type Locale = "en" | "fr";

export const translations = {
  en: {
    role: "AI Creative Producer",
    tagline: "I design Gen AI creative workflows from concept to delivery.",
    scrollHint: "Scroll to explore",
    projects: "Work",
    viewProject: "View project",
    manifestoTitle: "Who I am",
    manifesto: [
      "Curious and mostly self-taught. I've built my craft across design, motion, 3D, and UI, project by project.",
      "I'm meticulous with the finish, always exploring in the process. I test new tools, compare workflows, and give ideas the time they need to go somewhere less obvious.",
      "Today I lead Gen AI production for brands, labels, and platforms, from concept through to delivery.",
    ],
    contactTitle: "Let's work together",
    contactSubtitle: "Open to collaborations, freelance projects, and creative roles.",
    email: "miguelhumberto.pro@gmail.com",
    linkedin: "LinkedIn",
    cvSoon: "CV, coming soon",
    modal: {
      context: "Context",
      deliverables: "All Deliverables",
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
    },
    header: {
      contact: "Contact",
    },
  },
  fr: {
    role: "Producteur créatif IA",
    tagline: "Je conçois des workflows créatifs Gen AI, du concept à la livraison.",
    scrollHint: "Défiler pour explorer",
    projects: "Projets",
    viewProject: "Voir le projet",
    manifestoTitle: "Qui je suis",
    manifesto: [
      "Curieux et en grande partie autodidacte. J'ai construit mon savoir-faire entre le design, le motion, la 3D et l'UI, projet après projet.",
      "Méticuleux sur la finition, curieux sur la méthode. Je teste, je compare, et je laisse aux idées le temps d'aller vers quelque chose de moins évident.",
      "Aujourd'hui, je pilote la production Gen AI pour des marques, des labels et des plateformes, du concept à la livraison.",
    ],
    contactTitle: "Travaillons ensemble",
    contactSubtitle: "Ouvert aux collaborations, projets freelance et rôles créatifs.",
    email: "miguelhumberto.pro@gmail.com",
    linkedin: "LinkedIn",
    cvSoon: "CV, bientôt disponible",
    modal: {
      context: "Contexte",
      deliverables: "Tous les livrables",
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
    },
    header: {
      contact: "Contact",
    },
  },
} as const;

export type TranslationKey = typeof translations.en;
