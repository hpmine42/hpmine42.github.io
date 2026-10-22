# hpmine42.github.io

Portfolio of hpmine42, built with Vue 3, TypeScript and Vite. Live at <https://hpmine42.github.io/>.

The page has two parts: a dot-matrix hero and **enough.**, clearly marked as the selected project and sitting on an animated field of changing hexadecimal digits with a pointer light. Under it a short note points to GitHub for the rest of the work. Everything is in English and kept deliberately short.

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

Vite prints the local address (usually <http://localhost:5173/>). The dev server accepts any host name so the sandbox preview works; the build is unaffected.

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
public/og.jpg                  Social share image (1200 x 630)
public/robots.txt              Crawler rules, points at the sitemap
public/sitemap.xml             Single-URL sitemap
public/404.html                Static 404 page for GitHub Pages
src/
  main.ts                      Entry point, fonts and global styles
  App.vue                      Page composition
  data/content.ts              All copy, links and navigation items
  styles/tokens.css            Colours, type scale, spacing, motion tokens
  styles/base.css              Reset, focus styles, utilities
  composables/                 useReducedMotion, useActiveSection, useScrollProgressVar
  components/
    SiteHeader.vue             Fixed navigation
    HeroSection.vue            Hero layout
    DotField.vue               Canvas dot-matrix name with pointer trail
    ProjectEnough.vue          enough. section: selected-project label, highlights, demo panel, GitHub note
    EnoughBackdrop.vue         Changing hex digits and the pointer light behind enough.
    EnoughThread.vue           Two chat bubbles: ciphertext out, plaintext in
    FactList.vue               Small label and value list
    ExternalLink.vue           External link with new-tab hint for screen readers
    GitHubMark.vue             The GitHub mark, inline, next to GitHub links
    SiteFooter.vue             Footer with the GitHub link
```

## Editing the content

All text, links and navigation items live in `src/data/content.ts`.

- **enough.**: <https://hpmine42.github.io/enough/> (source: <https://github.com/hpmine42/enough>)
- **All repositories**: <https://github.com/hpmine42?tab=repositories>

The `enough` object holds the kicker ("Selected project"), the summary, the three highlights and the facts; `elsewhere` holds the note that the rest of the work is on GitHub. The description and the facts follow the README of the enough. repository. If enough. changes, update those objects.

## Metadata

`index.html` carries the usual Open Graph and Twitter tags, including `public/og.jpg` (1200 x 630) as the share image, plus JSON-LD for the person and the site. `public/robots.txt` points at `public/sitemap.xml`. When the share image changes, keep it at 1200 x 630 and below ~300 kB.

## Motion and accessibility

- With `prefers-reduced-motion: reduce` the dot field is drawn once without scatter or pointer response, the enough. digit field is painted once and stops changing (the pointer light stays off), the enough. message is shown decrypted, the reveal animations are skipped and the title weight no longer follows scroll.
- The dot-matrix canvas is decorative (`aria-hidden`); the page heading is a real, visually hidden `h1`.
- All interactive elements are reachable by keyboard and have a visible focus ring.
- External links announce that they open in a new tab.
- The animation loop of the hero only runs while dots are moving and while the hero is on screen. When the loop has to stop (scrolled away, hidden tab), the transient state — trail, head, press bloom, displaced dots — is settled and repainted, so nothing freezes mid-animation.
- The pointer trail is made by the dot field itself: the dots the tail passes over turn signal blue and swell, and they are barely pushed aside, so the trail is filled rather than hollow. Only the head is a single small solid dot.
- The pointer tail holds for a moment when the pointer rests, then retracts into the head and fades out completely; moving again unrolls a fresh tail out of the head instead of popping one in. On touch the gesture ends when the finger lifts.
- The name in the hero reacts much more strongly to the tail than the rest of the dot field: the letters feel it from further away, are pushed several times harder, take the full glow and may travel up to 3.8 dot spacings on a loose spring. The cap still keeps them from tearing apart.
- The enough. digit field repaints only when its characters actually change and only while the section is on screen; the pointer light is a separate, screen-blended layer that only moves by transform.

## Notes

- Every surface is graphite now; the digit field is the only texture on the page and the header simply sits on paper colour.
- The digit cells are drawn at a slightly lower resolution than the screen, which is invisible on a dim background but keeps the repaints cheap.
- The enough. chat demo keeps its message on one line while it resolves: an invisible copy of the final sentence reserves the space and the animated text is layered on top, so the panel never jumps.
- `public/404.html` is a plain static page (no Vue) so it works without the app bundle.
