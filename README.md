# hpmine42.github.io

Portfolio of hpmine42, built with Vue 3, TypeScript and Vite. Live at <https://hpmine42.github.io/>.

The page has two parts: a dot-matrix hero and the project **enough.**, which sits on an animated field of changing hexadecimal digits with a pointer light. Everything is in English and kept deliberately short.

## Stack

- Vue 3 (Composition API, `<script setup lang="ts">`)
- TypeScript in strict mode, checked with `vue-tsc`
- Vite 8
- Self-hosted variable fonts (`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`), so nothing is loaded from a third-party host
- Plain CSS with design tokens, no UI library, no analytics, no backend

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by Vite 8)
- npm

## Local development

```bash
npm install
npm run dev
```

Vite prints the local address (usually <http://localhost:5173/>).

## Scripts

| Command             | What it does                                                  |
| ------------------- | ------------------------------------------------------------- |
| `npm run dev`       | Start the dev server                                          |
| `npm run typecheck` | Run `vue-tsc` for the app and for the Vite config             |
| `npm run build`     | Type-check, then create the production build in `dist/`       |
| `npm run preview`   | Serve the production build locally (<http://localhost:4173/>) |

## Deployment to GitHub Pages

The site is served from the root of `https://hpmine42.github.io/`, so the Vite `base` is `/` (see `vite.config.ts`).

1. Use the repository **`hpmine42/hpmine42.github.io`** (the user site repository) and put these files at its root. Commit `package-lock.json`: the workflow runs `npm ci`.
2. In the repository open **Settings, Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. `.github/workflows/deploy.yml` installs the dependencies, runs the type check and the build, and publishes `dist/`. You can also start it manually from the **Actions** tab (`workflow_dispatch`).

### Important: do not create an `enough/` folder here

`https://hpmine42.github.io/enough/` is served by its own project repository. Do not add a folder with that name to this repository (not even under `public/`), otherwise it would collide with the project site.

## Project structure

```text
.github/workflows/deploy.yml   Build and deploy to GitHub Pages
public/favicon.svg             Favicon
src/
  main.ts                      Entry point, fonts and global styles
  App.vue                      Page composition
  data/content.ts              All copy, links and demo data
  styles/tokens.css            Colours, type scale, spacing, motion tokens
  styles/base.css              Reset, focus styles, utilities
  composables/                 useReducedMotion, useActiveSection, useScrollProgressVar
  components/
    SiteHeader.vue             Fixed navigation
    HeroSection.vue            Hero layout
    DotField.vue               Canvas dot-matrix name with pointer response
    ProjectEnough.vue          enough. section
    EnoughBackdrop.vue         Changing hex digits and the pointer light behind enough.
    EnoughThread.vue           Message travelling between two people, then decrypting
    FactList.vue               Small label and value list
    ExternalLink.vue           External link with new-tab hint for screen readers
    SiteFooter.vue             Footer with the GitHub link
```

## Editing the content

All text, links and navigation items live in `src/data/content.ts`.

- **enough.**: <https://hpmine42.github.io/enough/> (source: <https://github.com/hpmine42/enough>)

The description and the facts follow the README of the enough. repository. If enough. changes, update the `enough` object in that file.

## Motion and accessibility

- With `prefers-reduced-motion: reduce` the dot field is drawn once without scatter or pointer response, the enough. digit field is painted once and stops changing (the pointer light stays off), the enough. message is shown decrypted, and the title weight no longer follows scroll.
- The dot-matrix canvas is decorative (`aria-hidden`); the page heading is a real, visually hidden `h1`.
- All interactive elements are reachable by keyboard and have a visible focus ring.
- External links announce that they open in a new tab.
- The animation loop of the hero only runs while dots are moving and while the hero is on screen.
- The enough. digit field repaints only when its characters actually change (about eight times a second) and only while the section is on screen; the pointer light is a separate, screen-blended layer that only moves by transform.

## Notes

- Every surface is graphite now; the digit field is the only texture on the page and the header simply sits on paper colour.
- The digit cells are drawn at a slightly lower resolution than the screen, which is invisible on a dim background but keeps the repaints cheap.
