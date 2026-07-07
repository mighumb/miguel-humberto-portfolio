# AI Creative Producer — Portfolio Wireframe

Interactive wireframe for an AI creative portfolio targeting the ElevenLabs AI Creative Producer role.

## Features

- **Hero** — Single-column layout with fluid 3D particle scene (React Three Fiber) + typography below
- **Projects** — Staggered 2-column grid, 4:3 thumbnails, hover video playback
- **Modal** — Fullscreen opaque project detail with 6 zones (deliverable, context, all deliverables, process, tools, links)
- **i18n** — EN default, FR toggle
- **Theme** — Light default (Apple-style `#F5F5F7`), dark mode toggle
- **Typography** — Satoshi (Fontshare)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- Next.js 15 (App Router)
- Tailwind CSS 4
- React Three Fiber + Three.js
- TypeScript

## Wireframe Status

All content is placeholder. Replace project data in `src/lib/projects.ts` and translations in `src/lib/i18n.ts` as you build out real projects.
