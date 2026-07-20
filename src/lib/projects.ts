import type { PortfolioTrack } from "@/lib/portfolioTypes";

export interface Project {
  id: string;
  track: PortfolioTrack;
  title: { en: string; fr: string };
  description: { en: string; fr: string };
  tags: string[];
  year: string;
  type: string;
  hasVideo: boolean;
  videoUrl?: string;
  tools: string[];
  links: {
    notion?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
  };
  deliverableCount: number;
}

export const projects: Project[] = [
  {
    id: "01",
    track: "ai",
    title: { en: "Cinematic AI Short Film", fr: "Court-métrage IA cinématique" },
    description: {
      en: "A narrative short film generated and edited entirely with AI tools, exploring atmospheric storytelling.",
      fr: "Un court-métrage narratif généré et monté entièrement avec des outils IA, explorant la narration atmosphérique.",
    },
    tags: ["Video", "Cinematic", "Runway"],
    year: "2025",
    type: "Video",
    hasVideo: true,
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    tools: ["Runway Gen-3", "Midjourney", "Premiere Pro", "ElevenLabs"],
    links: { notion: "#", youtube: "#", instagram: "#" },
    deliverableCount: 8,
  },
  {
    id: "02",
    track: "ai",
    title: { en: "Social Campaign — Brand X", fr: "Campagne social — Brand X" },
    description: {
      en: "Multi-format social assets for a client campaign, from concept to delivery in 48 hours.",
      fr: "Assets social multi-formats pour une campagne client, du concept à la livraison en 48 heures.",
    },
    tags: ["Client", "Social", "Image"],
    year: "2025",
    type: "Client",
    hasVideo: false,
    tools: ["Midjourney", "Photoshop", "CapCut"],
    links: { notion: "#", instagram: "#", tiktok: "#" },
    deliverableCount: 12,
  },
  {
    id: "03",
    track: "ai",
    title: { en: "Prompt Engineering Tutorial Series", fr: "Série de tutoriels prompting" },
    description: {
      en: "Educational video series teaching advanced prompting techniques for image and video generation.",
      fr: "Série vidéo éducative enseignant des techniques de prompting avancées pour l'image et la vidéo.",
    },
    tags: ["Tutorial", "YouTube", "Education"],
    year: "2024",
    type: "Social",
    hasVideo: true,
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    tools: ["Midjourney", "DaVinci Resolve", "Notion"],
    links: { youtube: "#", notion: "#" },
    deliverableCount: 6,
  },
  {
    id: "04",
    track: "ai",
    title: { en: "Generative Visual Identity", fr: "Identité visuelle générative" },
    description: {
      en: "AI-generated brand visuals and motion assets for a startup's launch campaign.",
      fr: "Visuels de marque et assets motion générés par IA pour le lancement d'une startup.",
    },
    tags: ["Client", "Branding", "Motion"],
    year: "2024",
    type: "Client",
    hasVideo: true,
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
    tools: ["DALL·E 3", "After Effects", "Figma"],
    links: { notion: "#", instagram: "#" },
    deliverableCount: 10,
  },
  {
    id: "05",
    track: "ai",
    title: { en: "TikTok AI Art Experiments", fr: "Expériences art IA TikTok" },
    description: {
      en: "Short-form experimental content pushing the boundaries of AI-generated aesthetics.",
      fr: "Contenu court expérimental repoussant les limites de l'esthétique générée par IA.",
    },
    tags: ["Social", "TikTok", "Experimental"],
    year: "2025",
    type: "Social",
    hasVideo: true,
    videoUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
    tools: ["Kling", "CapCut", "Suno"],
    links: { tiktok: "#", instagram: "#" },
    deliverableCount: 15,
  },
  {
    id: "06",
    track: "ai",
    title: { en: "Audio-Visual AI Installation", fr: "Installation audio-visuelle IA" },
    description: {
      en: "An immersive audio-visual piece combining generative soundscapes with reactive visuals.",
      fr: "Une pièce audio-visuelle immersive combinant paysages sonores génératifs et visuels réactifs.",
    },
    tags: ["Audio", "Installation", "Experimental"],
    year: "2024",
    type: "Audio",
    hasVideo: false,
    tools: ["Suno", "TouchDesigner", "Ableton"],
    links: { youtube: "#", notion: "#" },
    deliverableCount: 5,
  },
  {
    id: "p01",
    track: "product",
    title: { en: "SaaS Dashboard Redesign", fr: "Refonte dashboard SaaS" },
    description: {
      en: "End-to-end UX redesign of an analytics dashboard, from research to high-fidelity UI.",
      fr: "Refonte UX complète d'un dashboard analytics, de la recherche à l'UI haute fidélité.",
    },
    tags: ["UX", "UI", "SaaS"],
    year: "2025",
    type: "Product",
    hasVideo: false,
    tools: ["Figma", "FigJam", "Notion"],
    links: { notion: "#" },
    deliverableCount: 8,
  },
  {
    id: "p02",
    track: "product",
    title: { en: "Onboarding Flow Optimization", fr: "Optimisation du parcours d'onboarding" },
    description: {
      en: "Reduced drop-off in a multi-step onboarding with clearer hierarchy and progressive disclosure.",
      fr: "Réduction du drop-off d'un onboarding multi-étapes via hiérarchie claire et divulgation progressive.",
    },
    tags: ["UX", "Conversion", "Research"],
    year: "2025",
    type: "Product",
    hasVideo: false,
    tools: ["Figma", "Maze", "Hotjar"],
    links: { notion: "#" },
    deliverableCount: 6,
  },
  {
    id: "p03",
    track: "product",
    title: { en: "Design System Foundations", fr: "Fondations design system" },
    description: {
      en: "Component library and tokens that align product UI across web and mobile surfaces.",
      fr: "Bibliothèque de composants et tokens pour aligner l'UI produit web et mobile.",
    },
    tags: ["Design System", "UI", "Tokens"],
    year: "2024",
    type: "Product",
    hasVideo: false,
    tools: ["Figma", "Storybook"],
    links: { notion: "#" },
    deliverableCount: 10,
  },
  {
    id: "p04",
    track: "product",
    title: { en: "Mobile App Wireframes", fr: "Wireframes application mobile" },
    description: {
      en: "Information architecture and wireframes for a consumer mobile product MVP.",
      fr: "Architecture de l'information et wireframes pour le MVP d'une app mobile consumer.",
    },
    tags: ["Wireframes", "Mobile", "IA"],
    year: "2024",
    type: "Product",
    hasVideo: false,
    tools: ["Figma", "FigJam"],
    links: { notion: "#" },
    deliverableCount: 7,
  },
];

export function projectsForTrack(track: PortfolioTrack) {
  return projects.filter((project) => project.track === track);
}
