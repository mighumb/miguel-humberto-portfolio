export interface Project {
  id: string;
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
];
