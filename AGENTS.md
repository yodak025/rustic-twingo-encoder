# Agent Guidelines for Rustic Twingo Encoder

## Build/Dev Commands
- `npm run dev` - Start Next.js dev server (localhost:3000)
- `npm run build` - Production build
- `npm start` - Start production server
- No tests configured yet

## Project Stack
- **Next.js 16** (App Router) + React 19 + JavaScript (no TypeScript)
- **Tailwind CSS 4** (inline theme, no config file)
- **Node.js 20+** required (use nvm if needed)

## Code Style
- **Import aliases**: Use `@/` for root imports (e.g., `import foo from '@/lib/utils'`)
- **Components**: Functional components, destructure props
- **File structure**: `app/` for pages/layouts, `app/api/` for API routes
- **API Routes**: Export `GET`, `POST`, etc. from `route.js` files
- **Client components**: Add `'use client'` directive only when using hooks/interactivity
- **Naming**: camelCase for variables/functions, PascalCase for components
- **Styles**: Tailwind utility classes, keep aesthetic simple and minimal

## Architecture Notes
- MVP for audio transcoding with ffmpeg via bash scripts
- Backend: API routes call bash scripts (use `child_process`)
- Config: JSON file for settings (directories, output paths, encoding profiles)
- No WebSockets initially, use simple polling for job status
