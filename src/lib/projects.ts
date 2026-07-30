export type ProjectTrack = "ai" | "craft";

export interface Project {
  id: string;
  /** Folder name under public/projects/{track}/ */
  slug: string;
  track: ProjectTrack;
  title: { en: string; fr: string };
  description: { en: string; fr: string };
  tags: string[];
  year: string;
  type: string;
  hasVideo: boolean;
  videoUrl?: string;
  /**
   * Local still in the project folder (e.g. "thumbnail.png").
   * Used for the Work card; also reused as cover when `cover` is omitted.
   */
  thumbnail?: string;
  /** Optional local cover still/loop poster; falls back to `thumbnail` when absent. */
  cover?: string;
  tools: string[];
  links: {
    notion?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
  };
  deliverableCount: number;
}

/** Public URL root for a project's local assets. */
export function projectAssetBase(project: Pick<Project, "track" | "slug">) {
  return `/projects/${project.track}/${project.slug}`;
}

function projectFileUrl(
  project: Pick<Project, "track" | "slug">,
  file: string | undefined,
): string | null {
  if (!file) return null;
  if (file.startsWith("http://") || file.startsWith("https://") || file.startsWith("/")) {
    return file;
  }
  return `${projectAssetBase(project)}/${file}`;
}

/** Work card / shared-flight still. */
export function projectThumbnailUrl(project: Project) {
  return projectFileUrl(project, project.thumbnail);
}

/** Modal hero still when there is no local/embed video — reuses thumbnail if needed. */
export function projectCoverUrl(project: Project) {
  return projectFileUrl(project, project.cover ?? project.thumbnail);
}

export const projects: Project[] = [
  {
    id: "01",
    slug: "cinematic-ai-short-film",
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
    slug: "social-campaign-brand-x",
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
    slug: "prompt-engineering-tutorial-series",
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
    slug: "generative-visual-identity",
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
    slug: "tiktok-ai-art-experiments",
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
    slug: "audio-visual-ai-installation",
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
    id: "c01",
    slug: "ekara-design-system",
    track: "craft",
    title: { en: "Ekara Design System", fr: "Ekara Design System" },
    description: {
      en: "A modular interface system for a B2B product — components, spacing, and interaction states built for clarity at scale.",
      fr: "Un système d'interface modulaire pour un produit B2B — composants, espacements et états d'interaction pensés pour la clarté à l'échelle.",
    },
    tags: ["UI", "Design System", "Product"],
    year: "2025",
    type: "Craft",
    hasVideo: false,
    thumbnail: "thumbnail.png",
    tools: ["Figma", "FigJam", "Notion"],
    links: { notion: "#" },
    deliverableCount: 8,
  },
  {
    id: "c02",
    slug: "motion-brand-language",
    track: "craft",
    title: { en: "Motion Brand Language", fr: "Langage motion de marque" },
    description: {
      en: "A motion kit defining timing, easing, and transitions for a brand identity across web and social.",
      fr: "Un kit motion définissant timing, easing et transitions pour une identité de marque web et social.",
    },
    tags: ["Motion", "Branding", "After Effects"],
    year: "2025",
    type: "Craft",
    hasVideo: false,
    tools: ["After Effects", "Figma", "Lottie"],
    links: { notion: "#" },
    deliverableCount: 6,
  },
  {
    id: "c03",
    slug: "3d-product-visualization",
    track: "craft",
    title: { en: "3D Product Visualization", fr: "Visualisation produit 3D" },
    description: {
      en: "Stylized 3D scenes and stills for a product launch — lighting, materials, and composition focused on shelf appeal.",
      fr: "Scènes et stills 3D stylisés pour un lancement produit — lumière, matières et composition orientées désirabilité.",
    },
    tags: ["3D", "Product", "Lookdev"],
    year: "2024",
    type: "Craft",
    hasVideo: false,
    tools: ["Blender", "Substance", "Photoshop"],
    links: { notion: "#" },
    deliverableCount: 7,
  },
  {
    id: "c04",
    slug: "editorial-web-experience",
    track: "craft",
    title: { en: "Editorial Web Experience", fr: "Expérience web éditoriale" },
    description: {
      en: "A scrolling editorial layout combining typography, imagery, and subtle interaction for a cultural platform.",
      fr: "Une mise en page éditoriale scrollable alliant typographie, images et interactions discrètes pour une plateforme culturelle.",
    },
    tags: ["UI", "Editorial", "Web"],
    year: "2024",
    type: "Craft",
    hasVideo: false,
    tools: ["Figma", "Framer", "Photoshop"],
    links: { notion: "#" },
    deliverableCount: 9,
  },
  {
    id: "c05",
    slug: "app-onboarding-flows",
    track: "craft",
    title: { en: "App Onboarding Flows", fr: "Parcours d'onboarding app" },
    description: {
      en: "Wireframes to high-fidelity screens for a mobile onboarding sequence with progressive disclosure.",
      fr: "Des wireframes aux écrans haute fidélité pour un onboarding mobile en divulgation progressive.",
    },
    tags: ["UX", "Mobile", "UI"],
    year: "2025",
    type: "Craft",
    hasVideo: false,
    tools: ["Figma", "Maze"],
    links: { notion: "#" },
    deliverableCount: 5,
  },
  {
    id: "c06",
    slug: "spatial-interface-concept",
    track: "craft",
    title: { en: "Spatial Interface Concept", fr: "Concept d'interface spatiale" },
    description: {
      en: "A speculative UI concept exploring depth, layers, and gesture in a spatial computing context.",
      fr: "Un concept UI spéculatif explorant profondeur, calques et gestes dans un contexte de spatial computing.",
    },
    tags: ["3D", "UI", "Concept"],
    year: "2024",
    type: "Craft",
    hasVideo: false,
    tools: ["Figma", "Spline", "Blender"],
    links: { notion: "#" },
    deliverableCount: 6,
  },
];

export function projectsForTrack(track: ProjectTrack) {
  return projects.filter((project) => project.track === track);
}
