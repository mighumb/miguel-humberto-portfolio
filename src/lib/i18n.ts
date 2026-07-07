export type Locale = "en" | "fr";

export const translations = {
  en: {
    role: "AI Creative Producer",
    tagline: "Transforming generative models into visual stories that resonate.",
    scrollHint: "Scroll to explore",
    projects: "Selected Work",
    viewProject: "View project",
    manifestoTitle: "Manifesto",
    manifesto: [
      "I operate at the intersection of storytelling, prompting, and production at scale.",
      "Image, video, audio — I prototype, test, and document.",
      "For social platforms, for clients, and to show others what's possible with AI.",
    ],
    contactTitle: "Let's work together",
    contactSubtitle: "Open to collaborations, freelance projects, and creative roles.",
    email: "hello@yourname.com",
    linkedin: "LinkedIn",
    cvSoon: "CV — coming soon",
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
    role: "Créateur de contenus IA",
    tagline: "Transformer les modèles génératifs en histoires visuelles qui résonnent.",
    scrollHint: "Défiler pour explorer",
    projects: "Projets sélectionnés",
    viewProject: "Voir le projet",
    manifestoTitle: "Manifeste",
    manifesto: [
      "J'évolue à l'intersection de la narration, du prompting et de la production à grande échelle.",
      "Image, vidéo, audio — je prototype, teste et documente.",
      "Pour les réseaux sociaux, pour des clients, et pour montrer ce qui est possible avec l'IA.",
    ],
    contactTitle: "Travaillons ensemble",
    contactSubtitle: "Ouvert aux collaborations, projets freelance et rôles créatifs.",
    email: "hello@yourname.com",
    linkedin: "LinkedIn",
    cvSoon: "CV — bientôt disponible",
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
