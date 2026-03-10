# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Run ESLint (flat config with Next.js core-web-vitals + TypeScript rules)
- `npm start` — Start production server

## Architecture

- **Next.js 16** with App Router, React 19, TypeScript (strict mode)
- **Tailwind CSS v4** via `@tailwindcss/postcss` plugin (no `tailwind.config` file — config is in `app/globals.css` using `@theme inline`)
- **shadcn/ui** (new-york style, RSC enabled) — components go in `components/ui/`, add via `npx shadcn add <component>`
- **Icon library**: lucide-react
- **Path alias**: `@/*` maps to project root

## Key Files

- `app/globals.css` — Tailwind theme, CSS variables (light/dark), shadcn design tokens
- `lib/utils.ts` — `cn()` helper (clsx + tailwind-merge)
- `components.json` — shadcn/ui configuration

## Conventions

- Uses Geist and Geist Mono fonts (loaded in `app/layout.tsx`)
- Dark mode via `.dark` class (CSS variables swap in `globals.css`)
- Neutral base color palette (oklch color values)
