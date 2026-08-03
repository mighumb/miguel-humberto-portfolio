export type ProjectTrack = "ai" | "craft";

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
  title: { en: string; fr: string };
  /** Modal Context section. Falls back to a generic placeholder when omitted. */
  context?: { en: string; fr: string };
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
    figma?: string;
  };
  deliverableCount: number;
  /** Explicit deliverables list. When set, overrides deliverableCount placeholders. */
  deliverables?: Deliverable[];
  /** Filenames relative to the project folder shown in the Process section. */
  processImages?: string[];
  /** Vertical workflow items (loops / images). Takes priority over processImages. */
  processItems?: ProcessItem[];
  /** Overrides the "Process" section heading for this project. */
  processTitle?: { en: string; fr: string };
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
    tags: ["CGI", "Social", "Viral"],
    year: "2025",
    type: "Video",
    hasVideo: true,
    // ?v=2 busts browser media caches (iOS keeps serving the old bytes for a
    // previously-fetched URL); bump it whenever this file is replaced.
    videoUrl: "/projects/ai/ai-cgi-station-f/cover-video-ai-cgi-station-f.mp4?v=2",
    tools: ["Figma Weave", "Nano Banana", "Kling", "Premiere Pro", "After Effects", "Figma"],
    links: {
      youtube: "https://www.youtube.com/watch?v=uZgAkpXHltE",
      notion: "https://zenith-flood-86d.notion.site/WORKFLOW-CGI-g-n-rative-avec-Weavy-AI-2bb7cd46589480cab066f0cf921e8e1d?pvs=143",
      instagram: "https://www.instagram.com/p/DR9fJ8YDb_Y/?img_index=1",
    },
    deliverableCount: 3,
    deliverables: [
      { type: "video", url: "deliverables/deliverable-video-ai-cgi-station-f.mp4" },
      { type: "video", url: "deliverables/deliverable-video-ai-cgi-station-f-2.mp4" },
      { type: "video", url: "deliverables/deliverable-video-ai-cgi-station-f-3.mp4" },
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
    tags: ["VFX", "Music", "Social", "Viral"],
    year: "2025",
    type: "Video",
    hasVideo: true,
    videoUrl: "/projects/ai/big-flo-oli-colors-show/cover-video-big-flo-oli-colors-show.mp4",
    tools: ["Beeble", "Switch X", "Magnific", "Nano Banana", "Photoshop", "After Effects"],
    links: {
      instagram: "https://www.instagram.com/p/DV1U-P-iKRG/",
    },
    deliverableCount: 0,
    processTitle: { en: "Workflow", fr: "Workflow" },
    processItems: [
      { type: "loop", file: "process/process-psd-big-flo-oli-colors-show.mp4" },
      {
        type: "image",
        file: "process/process-magnific-big-flo-oli-colors-show.png",
        fullBleed: true,
      },
      { type: "loop", file: "process/process-compare-big-flo-oli-colors-show.mp4" },
    ],
  },
  {
    id: "03",
    slug: "prompt-engineering-tutorial-series",
    track: "ai",
    title: { en: "Prompt Engineering Tutorial Series", fr: "Série de tutoriels prompting" },
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
    context: {
      en: "[Ekara](https://ip-label.com/fr/) needed a new shared UI language for its new interfaces. I designed a modular system: components, spacing, and states, for clear, consistent screens.",
      fr: "[Ekara](https://ip-label.com/fr/) avait besoin d'un nouveau langage UI commun pour ses nouvelles interfaces. J'ai conçu un système modulaire : composants, espacements et états, pour des écrans clairs et cohérents.",
    },
    tags: ["UI", "Design System", "Product"],
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
