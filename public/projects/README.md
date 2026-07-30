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
  thumbnail.jpg|png|webp   # Work card poster (recommended)
  cover.mp4|webm           # optional local hover / hero loop
  cover.jpg|png|webp       # optional still if no local video
  deliverables/            # modal “All Deliverables” grid
  process/                 # process / step stills (optional)
  assets/                  # extras (logos, raw exports, etc.)
```

## Naming

- Folder = **slug** only (no number, no spaces): `ekara-design-system`
- Prefer lowercase kebab-case
- Display titles stay in `projects.ts` (EN / FR)
- Order on the site = order in `projects.ts`, not folder name

## Paths in the app

Example local files:

- `/projects/craft/ekara-design-system/thumbnail.jpg`
- `/projects/ai/cinematic-ai-short-film/cover.mp4`
- `/projects/craft/ekara-design-system/deliverables/01.jpg`

## Notes

- Keep loops short and compressed; large videos bloat git
- If the main film is an embed only, skip `cover.*` and set the embed URL in project data
- Empty `deliverables/`, `process/`, and `assets/` folders are kept via `.gitkeep` until you drop files in
