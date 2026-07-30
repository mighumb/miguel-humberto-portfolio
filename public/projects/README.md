# Project assets

Local media for Work cards and project modals. Embeds (YouTube, Vimeo, etc.) stay in `src/lib/projects.ts` — only files that ship with the site live here.

## Layout

```text
public/projects/
  ai/{slug}/
  craft/{slug}/
```

Each project folder:

```text
{slug}/
  thumbnail.png|jpg|webp   # Work card (+ cover fallback if no cover file)
  cover.mp4|webm           # optional local hover / hero loop
  cover.jpg|png|webp       # optional still if different from thumbnail
  deliverables/            # modal “All Deliverables” grid
  process/                 # process / step stills (optional)
  assets/                  # extras (logos, raw exports, etc.)
```

Drop a still into the project folder (any clear name), then set in `src/lib/projects.ts`:

```ts
thumbnail: "thumbnail-ekara-design-system-cover.png", // your filename
```

Recommended short name when you prefer: `thumbnail.png`.

If thumbnail and cover are the same image, **only add `thumbnail`** — do not duplicate the file. The site reuses it as cover automatically.

## Naming

- Folder = **slug** only (no number, no spaces): `ekara-design-system`
- Prefer lowercase kebab-case
- Display titles stay in `projects.ts` (EN / FR)
- Order on the site = order in `projects.ts`, not folder name

## Paths in the app

Example local files:

- `/projects/craft/ekara-design-system/thumbnail-ekara-design-system-cover.png`
- `/projects/ai/cinematic-ai-short-film/cover.mp4`
- `/projects/craft/ekara-design-system/deliverables/01.jpg`

## Notes

- Keep loops short and compressed; large videos bloat git
- If the main film is an embed only, skip `cover.*` and set the embed URL in project data
- Empty `deliverables/`, `process/`, and `assets/` folders are kept via `.gitkeep` until you drop files in
