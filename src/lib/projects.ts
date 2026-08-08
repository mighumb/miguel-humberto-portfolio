/** Which page a project shows up on today. */
export type ProjectCollection = "main" | "craft";

/**
 * What a project actually demonstrates. Only ever set from what the work shows,
 * never to widen a profile. Not surfaced yet: this is the ground for the filters
 * that will replace the two collections.
 */
export type ProjectCategory = "ai" | "3d" | "product";

/** Folder under public/projects/ holding a project's assets. */
export type ProjectAssetGroup = "ai" | "product" | "3d";

export type LocalizedCopy = { en: string; fr: string };

export type Deliverable =
  | { type: "video"; url: string }
  | { type: "instagram"; url: string }
  | { type: "image"; url: string; fallback: string; group?: string }
  | { type: "placeholder" };

/** Vertical workflow media (not the Ekara stacked-card pile). */
export type ProcessItem =
  | { type: "loop"; file: string }
  | { type: "image"; file: string; fullBleed?: boolean }
  | { type: "player"; file: string; poster: string; linkedinUrl?: string };

export interface Project {
  id: string;
  /** Folder name under public/projects/{assetGroup}/ */
  slug: string;
  collection: ProjectCollection;
  categories: ProjectCategory[];
  assetGroup: ProjectAssetGroup;
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
  /** Optional full-viewport, staggered layout for image deliverables. */
  deliverableLayout?: "bento" | "category-bento";
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
export function projectAssetBase(project: Pick<Project, "assetGroup" | "slug">) {
  return `/projects/${project.assetGroup}/${project.slug}`;
}

function projectFileUrl(
  project: Pick<Project, "assetGroup" | "slug">,
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
    collection: "main",
    categories: ["ai"],
    assetGroup: "ai",
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
    collection: "main",
    categories: ["ai"],
    assetGroup: "ai",
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
    collection: "main",
    categories: ["ai"],
    assetGroup: "ai",
    title: { en: "Goodies Factory", fr: "Goodies Factory" },
    context: {
      en: "Born from a collaboration with [Vendredi Society](https://vendredi-society.fr/), Goodies Factory is a set of three AI templates (Production, Scene, and Worn) for branded merchandise mockups. From a logo to a blank product, then a styled scene and a worn look, the workflow builds photoreal mockups for marketers and designers who want distinctive goodies instead of stock imagery.",
      fr: "Né d'une collaboration avec [Vendredi Society](https://vendredi-society.fr/), Goodies Factory est un set de trois templates IA (Production, Scene et Worn) pour des mockups de goodies de marque. Du logo au produit vierge, puis à une scène stylisée et un rendu porté, le workflow produit des mockups photoréalistes pour les marketeurs et designers qui veulent des goodies distinctifs plutôt que des images stock.",
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
    videoPoster: "poster-cover-goodies-factory.jpg",
    unmuteOnOpen: true,
    tools: [
      "Figma Weave",
      "Magnific",
      "Higgsfield",
      "Suno",
      "Figma",
      "Jitter",
      "Premiere Pro",
      "After Effects",
    ],
    // VS Good product URL - wire when available.
    links: { template: "#" },
    deliverableCount: 11,
    deliverableLayout: "bento",
    deliverables: [3, 9, 1, 4, 10, 7, 2, 5, 6, 11, 8].map((number) => ({
      type: "image" as const,
      url: `deliverables/deliverable-${number}-goodies-factory.webp`,
      fallback: `deliverables/deliverable-${number}-goodies-factory.jpg`,
    })),
    processTitle: { en: "Workflow", fr: "Workflow" },
    processItems: [
      {
        type: "image",
        file: "process/process-magnific-goodies-factory.png",
        fullBleed: true,
      },
      { type: "loop", file: "process/process-higgsfield-goodies-factory.mp4" },
      {
        type: "image",
        file: "process/process-figma-weave-goodies-factory.png",
        fullBleed: true,
      },
    ],
  },
  {
    id: "04",
    slug: "superman-save-minneapolis",
    collection: "main",
    categories: ["ai"],
    assetGroup: "ai",
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
    id: "05",
    slug: "verdio",
    collection: "main",
    categories: ["ai"],
    assetGroup: "ai",
    title: { en: "Verdio", fr: "Verdio" },
    context: {
      en: "Verdio is a natural cosmetics brand built around a clean botanical identity. I designed the logo, visual system, and brand direction, then generated photoreal packshots for four products across cream, gel, and oil formats.",
      fr: "Verdio est une marque de cosmétiques naturels construite autour d’une identité botanique sobre. J’ai conçu le logo, le système visuel et la direction artistique, puis généré des packshots photoréalistes pour quatre produits : crème, gel et huile.",
    },
    tags: [
      { en: "Packaging", fr: "Packaging" },
      { en: "Cosmetic", fr: "Cosmétique" },
      { en: "Branding", fr: "Branding" },
    ],
    year: "2025",
    type: "Video",
    hasVideo: true,
    // ?v=2 busts browser media caches after the cover re-upload.
    videoUrl: "/projects/ai/verdio/cover-video-verdio.mp4?v=2",
    videoPoster: "poster-cover-verdio.jpg",
    unmuteOnOpen: true,
    tools: ["Figma Weave", "Figma", "Nano Banana"],
    links: {
      notion:
        "https://zenith-flood-86d.notion.site/WORKFLOW-Packaging-Photor-aliste-avec-l-IA-2717cd46589480ea9f76ecb39715256d?source=copy_link",
    },
    deliverableCount: 14,
    deliverableLayout: "category-bento",
    deliverables: [
      ["alv", "alv_1"],
      ["alv", "alv_0"],
      ["alv", "alv_2"],
      ["alv", "alv_3"],
      ["crh", "crh_0_4k"],
      ["crh", "crh_2"],
      ["crh", "crh_3"],
      ["crh", "crh_1"],
      ["map", "map_1"],
      ["map", "map_2"],
      ["map", "map_3"],
      ["hln", "hln_1"],
      ["hln", "hln_2"],
      ["hln", "hln_3"],
    ].map(([group, name]) => ({
      type: "image" as const,
      group,
      url: `deliverables/deliverable-${name}-verdio.webp`,
      fallback: `deliverables/deliverable-${name}-verdio.jpg`,
    })),
    processTitle: { en: "Workflow", fr: "Workflow" },
    processItems: [
      {
        type: "image",
        file: "process/process-figma-1-verdio.png",
        fullBleed: true,
      },
      {
        type: "player",
        file: "process/process-linkedin-verdio.mp4",
        poster: "process/poster-linkedin-verdio.jpg",
        linkedinUrl:
          "https://www.linkedin.com/posts/miguel-humberto-a15b4794_directionartistique-designgraphique-moodboard-activity-7391889587675045888-ewkf",
      },
      {
        type: "image",
        file: "process/process-figma-weave-verdio.png",
        fullBleed: true,
      },
    ],
  },
  {
    id: "c01",
    slug: "ekara-design-system",
    collection: "craft",
    categories: ["product"],
    assetGroup: "product",
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
];

export function projectsForCollection(collection: ProjectCollection) {
  return projects.filter((project) => project.collection === collection);
}
