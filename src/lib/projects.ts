export type ProjectTrack = "ai" | "craft";

export type LocalizedCopy = { en: string; fr: string };

export type Deliverable =
  | { type: "video"; url: string }
  | { type: "instagram"; url: string }
  | { type: "placeholder" };

/** Vertical workflow media (not the Ekara stacked-card pile). */
export type ProcessItem =
  | { type: "loop"; file: string }
  | { type: "image"; file: string; fullBleed?: boolean };

export interface Project {
  id: string;
  /** Folder name under public/projects/{track}/ */
  slug: string;
  track: ProjectTrack;
  title: LocalizedCopy;
  /** Modal Context section. Falls back to a generic placeholder when omitted. */
  context?: LocalizedCopy;
  tags: LocalizedCopy[];
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
  /**
   * Still shown by the Work card video before it has a decoded frame. Cards
   * whose cover *is* a video would otherwise render empty until enough bytes
   * arrive, which offscreen carousel copies never do eagerly.
   */
  videoPoster?: string;
  /** Start the modal hero unmuted once the open transition lands. */
  unmuteOnOpen?: boolean;
  tools: string[];
  links: {
    notion?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    figma?: string;
    /** Product / template store page (e.g. VS Good). */
    template?: string;
  };
  deliverableCount: number;
  /** Explicit deliverables list. When set, overrides deliverableCount placeholders. */
  deliverables?: Deliverable[];
  /** Filenames relative to the project folder shown in the Process section. */
  processImages?: string[];
  /** Vertical workflow items (loops / images). Takes priority over processImages. */
  processItems?: ProcessItem[];
  /** Overrides the "Process" section heading for this project. */
  processTitle?: LocalizedCopy;
  /** Shows the interactive Ekara UI Kit section in the modal. */
  uiKit?: boolean;
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

/** Modal hero still when there is no local/embed video. Reuses thumbnail if needed. */
export function projectCoverUrl(project: Project) {
  return projectFileUrl(project, project.cover ?? project.thumbnail);
}

/** Work card video poster; falls back to the card still when there is one. */
export function projectVideoPosterUrl(project: Project) {
  return projectFileUrl(project, project.videoPoster ?? project.thumbnail);
}

export const projects: Project[] = [
  {
    id: "01",
    slug: "ai-cgi-station-f",
    track: "ai",
    title: { en: "AI CGI Station F", fr: "AI CGI Station F" },
    context: {
      en: "Station F is the world's largest startup campus, in Paris, home to hundreds of startups backed by Meta, Microsoft and Google. Its iconic clay sculpture became the starting point of this CGI project. Using AI, I transformed it into a series of iconic tech logos.",
      fr: "Station F est le plus grand campus de startups au monde, à Paris, accueillant des centaines d'entreprises soutenues par Meta, Microsoft et Google. Sa sculpture d'argile emblématique est devenue le point de départ de ce projet CGI. À l'aide de l'IA, je l'ai transformée en une série de logos iconiques du monde de la tech.",
    },
    tags: [
      { en: "CGI", fr: "CGI" },
      { en: "Social", fr: "Social" },
      { en: "Viral", fr: "Viral" },
    ],
    year: "2025",
    type: "Video",
    hasVideo: true,
    // ?v=3 busts browser media caches after the 5 Mbps + audio re-upload.
    videoUrl: "/projects/ai/ai-cgi-station-f/cover-video-ai-cgi-station-f.mp4?v=3",
    videoPoster: "poster-cover-ai-cgi-station-f.jpg",
    unmuteOnOpen: true,
    tools: ["Figma Weave", "Nano Banana", "Kling", "Premiere Pro", "After Effects", "Figma"],
    links: {
      youtube: "https://www.youtube.com/watch?v=uZgAkpXHltE",
      notion: "https://zenith-flood-86d.notion.site/WORKFLOW-CGI-g-n-rative-avec-Weavy-AI-2bb7cd46589480cab066f0cf921e8e1d?pvs=143",
      instagram: "https://www.instagram.com/p/DR9fJ8YDb_Y/?img_index=1",
    },
    deliverableCount: 3,
    deliverables: [
      { type: "video", url: "deliverables/deliverable-video-ai-cgi-station-f.mp4?v=3" },
      { type: "video", url: "deliverables/deliverable-video-ai-cgi-station-f-2.mp4?v=3" },
      { type: "video", url: "deliverables/deliverable-video-ai-cgi-station-f-3.mp4?v=3" },
    ],
  },
  {
    id: "02",
    slug: "big-flo-oli-colors-show",
    track: "ai",
    title: { en: "Big Flo & Oli - Colors Show", fr: "Big Flo & Oli - Colors Show" },
    context: {
      en: "[COLORS](https://www.youtube.com/channel/UC2Qw1dzXDBAZPwS7zm37g8g) is a live music series shot against a flat backdrop, and a global visual reference. Big Flo & Oli had never been invited: their [44D](https://youtu.be/tjsmTPVZhjk?si=mjBRzfW0a-TAJU7_&t=25) video, filmed in an Airbus hangar in Toulouse, reignited the debate. I turned that scene into a real COLORS Show, with a pink set as a nod to Toulouse, known as the Pink City.",
      fr: "[COLORS](https://www.youtube.com/channel/UC2Qw1dzXDBAZPwS7zm37g8g) est une série de lives musicaux filmés sur fond uni, devenue une référence visuelle mondiale. Big Flo & Oli n’y avaient jamais été invités : leur clip de [44D](https://youtu.be/tjsmTPVZhjk?si=mjBRzfW0a-TAJU7_&t=25), tourné dans un hangar Airbus à Toulouse, a relancé le débat. J’ai transformé cette scène en un vrai COLORS Show, rose en clin d’œil à Toulouse, appelée la ville rose.",
    },
    tags: [
      { en: "VFX", fr: "VFX" },
      { en: "Music", fr: "Musique" },
      { en: "Social", fr: "Social" },
      { en: "Viral", fr: "Viral" },
    ],
    year: "2025",
    type: "Video",
    hasVideo: true,
    videoUrl: "/projects/ai/big-flo-oli-colors-show/cover-video-big-flo-oli-colors-show.mp4?v=3",
    videoPoster: "poster-cover-big-flo-oli-colors-show.jpg",
    unmuteOnOpen: true,
    tools: ["Beeble", "Switch X", "Magnific", "Nano Banana", "Photoshop", "After Effects"],
    links: {
      instagram: "https://www.instagram.com/p/DV1U-P-iKRG/",
    },
    deliverableCount: 0,
    processTitle: { en: "Workflow", fr: "Workflow" },
    processItems: [
      { type: "loop", file: "process/process-psd-big-flo-oli-colors-show.mp4?v=3" },
      {
        type: "image",
        file: "process/process-magnific-big-flo-oli-colors-show.png",
        fullBleed: true,
      },
      { type: "loop", file: "process/process-compare-big-flo-oli-colors-show.mp4?v=5" },
    ],
  },
  {
    id: "03",
    slug: "goodies-factory",
    track: "ai",
    title: { en: "Goodies Factory", fr: "Goodies Factory" },
    context: {
      en: "Goodies Factory is a set of three AI templates (Production, Scene, and Worn) for branded merchandise mockups. From a logo to a blank product, then a styled scene and a worn look, the workflow builds photoreal mockups for marketers and designers who want distinctive goodies instead of stock imagery.",
      fr: "Goodies Factory est un set de trois templates IA (Production, Scene et Worn) pour des mockups de goodies de marque. Du logo au produit vierge, puis à une scène stylisée et un rendu porté, le workflow produit des mockups photoréalistes pour les marketeurs et designers qui veulent des goodies distinctifs plutôt que des images stock.",
    },
    tags: [
      { en: "Template", fr: "Template" },
      { en: "Mockup", fr: "Mockup" },
      { en: "Marketing", fr: "Marketing" },
    ],
    year: "2026",
    type: "Video",
    hasVideo: true,
    videoUrl: "/projects/ai/goodies-factory/cover-video-goodies-factory.mp4",
    tools: ["Figma Weave", "Magnific"],
    // VS Good product URL - wire when available.
    links: { template: "#" },
    deliverableCount: 0,
    processTitle: { en: "Workflow", fr: "Workflow" },
    processItems: [],
  },
  {
    id: "04",
    slug: "superman-save-minneapolis",
    track: "ai",
    title: {
      en: "Superman save Minneapolis",
      fr: "Superman sauve Minneapolis",
    },
    context: {
      en: "During the winter of 2025–2026, a large ICE enforcement surge in Minneapolis sparked protests, unrest, and nationwide attention. I made a short film that uses Superman as a symbol of hope, imagining a moment where conflict gives way to reconciliation.",
      fr: "Pendant l’hiver 2025–2026, un vaste déploiement de l’ICE à Minneapolis a déclenché manifestations, tensions et une forte attention médiatique. J’ai réalisé un court-métrage qui s’appuie sur Superman comme figure d’espoir, pour imaginer un instant où le conflit cède la place à la réconciliation.",
    },
    tags: [
      { en: "Short film", fr: "Court-métrage" },
      { en: "Social", fr: "Social" },
    ],
    year: "2026",
    type: "Video",
    hasVideo: true,
    // ?v=2 busts browser media caches after the higher-bitrate re-upload.
    videoUrl: "/projects/ai/superman-save-minneapolis/cover-video-superman-save-minneapolis.mp4?v=2",
    videoPoster: "poster-cover-superman-save-minneapolis.jpg",
    unmuteOnOpen: true,
    tools: ["Google Flow", "Midjourney", "Mito AI", "Figma Weave", "Higgsfield"],
    links: {
      youtube: "https://www.youtube.com/watch?v=HdKtbmCcnrI",
      instagram: "https://www.instagram.com/reel/DVs5qDijP-Y/",
    },
    deliverableCount: 0,
    processTitle: { en: "Workflow", fr: "Workflow" },
    processItems: [
      { type: "loop", file: "process/workflow-1-mito-ai-superman-save-minneapolis.mp4?v=2" },
      {
        type: "image",
        file: "process/workflow-2-figma-superman-save-minneapolis.png?v=2",
        fullBleed: true,
      },
      { type: "loop", file: "process/workflow-3-figma-weave-superman-save-minneapolis.mp4?v=2" },
      { type: "loop", file: "process/workflow-4-higgsfield-superman-save-minneapolis.mp4?v=2" },
    ],
  },
  {
    id: "c01",
    slug: "ekara-design-system",
    track: "craft",
    title: { en: "Ekara Design System", fr: "Ekara Design System" },
    context: {
      en: "[Ekara](https://ip-label.com/fr/) needed a new shared UI language for its new interfaces. I designed a modular system: components, spacing, and states, for clear, consistent screens.",
      fr: "[Ekara](https://ip-label.com/fr/) avait besoin d'un nouveau langage UI commun pour ses nouvelles interfaces. J'ai conçu un système modulaire : composants, espacements et états, pour des écrans clairs et cohérents.",
    },
    tags: [
      { en: "UI", fr: "UI" },
      { en: "Design System", fr: "Design System" },
      { en: "Product", fr: "Produit" },
    ],
    year: "2025",
    type: "Craft",
    hasVideo: false,
    thumbnail: "thumbnail-ekara-design-system.png",
    tools: ["Figma"],
    links: { figma: "https://www.figma.com/design/Fwn3pUkAQweQvuf2MVnqLH/0.-Design-system?node-id=3547-28514&t=VREC3uAjRDX57LBz-1" },
    deliverableCount: 8,
    processTitle: { en: "Brand system", fr: "Brand system" },
    processImages: [
      "process/deliverable-ekara-design-system-tokens-colors.png",
      "process/deliverable-ekara-design-system-tokens-shadow.png",
      "process/deliverable-ekara-design-system-alias-colors.png",
      "process/deliverable-ekara-design-system-alias-elevation.png",
      "process/deliverable-ekara-design-system-animations-table.png",
      "process/deliverable-ekara-design-system-mapped-button.png",
      "process/deliverable-ekara-design-system-mapped-chart.png",
      "process/deliverable-ekara-design-system-typography.png",
      "process/deliverable-ekara-design-system-color-principles.png",
      "process/deliverable-ekara-design-system-messages-complementary-colors.png",
      "process/deliverable-ekara-design-system-typography-color-palette-codes-and-accessibility-2.png",
      "process/deliverable-ekara-design-system-typography-color-palette-codes-and-accessibility-3.png",
      "process/deliverable-ekara-design-system-typography-color-palette-codes-and-accessibility-4.png",
    ],
    uiKit: true,
  },
  {
    id: "c02",
    slug: "motion-brand-language",
    track: "craft",
    title: { en: "Motion Brand Language", fr: "Langage motion de marque" },
    tags: [
      { en: "Motion", fr: "Motion" },
      { en: "Branding", fr: "Branding" },
      { en: "After Effects", fr: "After Effects" },
    ],
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
    tags: [
      { en: "3D", fr: "3D" },
      { en: "Product", fr: "Produit" },
      { en: "Lookdev", fr: "Lookdev" },
    ],
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
    tags: [
      { en: "UI", fr: "UI" },
      { en: "Editorial", fr: "Éditorial" },
      { en: "Web", fr: "Web" },
    ],
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
    tags: [
      { en: "UX", fr: "UX" },
      { en: "Mobile", fr: "Mobile" },
      { en: "UI", fr: "UI" },
    ],
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
    tags: [
      { en: "3D", fr: "3D" },
      { en: "UI", fr: "UI" },
      { en: "Concept", fr: "Concept" },
    ],
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
