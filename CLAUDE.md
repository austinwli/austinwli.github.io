# CLAUDE.md

## Project Overview

Personal portfolio website for Austin Li (austinwli.com), built with SvelteKit
as a static site deployed to GitHub Pages.

## Tech Stack

- **Framework:** SvelteKit 1.x with `@sveltejs/adapter-static` (fully
  pre-rendered)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with PostCSS, class-based dark mode
- **Build:** Vite 4.x with custom Markdown/YAML plugins
- **Fonts:** Newsreader (serif) via @fontsource

## Commands

| Command           | Purpose                         |
| ----------------- | ------------------------------- |
| `npm run dev`     | Start dev server                |
| `npm run build`   | Build static site to `build/`   |
| `npm run preview` | Preview production build        |
| `npm run check`   | Svelte/TypeScript type checking |
| `npm run lint`    | Check formatting (Prettier)     |
| `npm run format`  | Auto-format code (Prettier)     |

## Project Structure

- `src/routes/` — SvelteKit file-based routing (`+page.svelte`,
  `+layout.svelte`)
- `src/lib/components/` — Shared components (Header, Footer, Seo, Markdown)
- `src/lib/utils.ts` — Shared utilities
- `src/routes/watermark/` — Standalone image watermarking tool
- `src/projects/` — Markdown files with YAML frontmatter for project content
- `static/assets/` — Images and PDFs
- `static/CNAME` — Custom domain config

## Content

- Projects use Markdown with YAML frontmatter, parsed by a custom Vite plugin in
  `vite.config.ts`
- Writing and photography data live in YAML files (`writing.yaml`,
  `photos.yaml`) within their route directories

## Code Style

- Prettier with `proseWrap: always`
- 2-space indentation, LF line endings (see `.editorconfig`)
- Husky pre-commit hook runs `npm run format && npm run lint`

## Deployment

- GitHub Actions CI (`.github/workflows/ci.yml`) on push to `main`
- Pipeline: install → check → lint → build → deploy to `gh-pages` branch
- Node 18 in CI
