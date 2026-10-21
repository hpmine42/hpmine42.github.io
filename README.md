# hpmine42.github.io

Portfolio of Jakob, built with Vue 3, TypeScript and Vite. Live at <https://hpmine42.github.io/>.

The page has three parts: a dot-matrix hero, the project **enough.** and the project **Aiko**. Everything is in English and kept deliberately short.

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

### Important: do not create `enough/` or `Aiko/` folders here

`https://hpmine42.github.io/enough/` and `https://hpmine42.github.io/Aiko/` are served by their own project repositories. Do not add folders with those names to this repository (not even under `public/`), otherwise they would collide with the project sites.

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
    SiteHeader.vue             Fixed navigation, inverts over the light section
    HeroSection.vue            Hero layout
    DotField.vue               Canvas dot-matrix name with pointer response
    ProjectEnough.vue          enough. section
    EnoughThread.vue           Message travelling between two people, then decrypting
    ProjectAiko.vue            Aiko section
    AikoResolver.vue           Replays how Aiko picks the stage that answers
    FactList.vue               Small label and value list
    ExternalLink.vue           External link with new-tab hint for screen readers
    SiteFooter.vue             Footer with the GitHub link
```

## Editing the content

All text, links and the Aiko demo data live in `src/data/content.ts`.

- **enough.**: <https://hpmine42.github.io/enough/> (source: <https://github.com/hpmine42/enough>)
- **Aiko**: <https://hpmine42.github.io/Aiko/> (source: <https://github.com/hpmine42/Aiko>)

The Aiko description and the stage list in the resolver follow the README of the Aiko repository. If Aiko changes, update the `aiko` object and the `resolver*` data in that file.

## Motion and accessibility

- With `prefers-reduced-motion: reduce` the dot field is drawn once without scatter or pointer response, the enough. message is shown decrypted, the Aiko resolver jumps straight to its result, and the title weight no longer follows scroll.
- The dot-matrix canvas is decorative (`aria-hidden`); the page heading is a real, visually hidden `h1`.
- All interactive elements are reachable by keyboard and have a visible focus ring.
- External links announce that they open in a new tab.
- The animation loop of the hero only runs while dots are moving and while the hero is on screen.

## Notes

- The header uses `mix-blend-mode: difference`, so one set of links stays readable on the dark and on the light section.
- The Aiko resolver uses the example inputs `/timer 5 Minuten`, `warum?` and `23 × 17` in the original German, because that is what the app expects.
