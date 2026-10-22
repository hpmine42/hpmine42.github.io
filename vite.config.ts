import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'

/**
 * Preloads the two latin Geist font files in the built page.
 *
 * The font files only get their hashed names during the build, so they cannot
 * be written into index.html by hand. This plugin runs after the bundle is
 * created, finds the latin woff2 files of both families and adds a preload
 * link for each — the first paint then fetches them in parallel with the
 * stylesheet instead of after it.
 */
function preloadFonts(): Plugin {
  return {
    name: 'preload-geist-fonts',
    apply: 'build',
    enforce: 'post',
    transformIndexHtml(html, ctx) {
      const files = Object.keys(ctx.bundle ?? {}).filter(
        (file) => file.endsWith('.woff2') && /geist(-mono)?-latin-wght-normal/.test(file),
      )
      if (files.length === 0) return html
      return {
        html,
        tags: files.map((file) => ({
          tag: 'link',
          attrs: {
            rel: 'preload',
            as: 'font',
            type: 'font/woff2',
            href: `/${file}`,
            crossorigin: '',
          },
          injectTo: 'head' as const,
        })),
      }
    },
  }
}

// The site lives at the root of https://hpmine42.github.io/, so the base is "/".
export default defineConfig({
  base: '/',
  plugins: [vue(), preloadFonts()],
  // Dev only: accept whatever host the dev server is reached through
  // (localhost, a tunnel, a container preview). The build is unaffected.
  server: { allowedHosts: true },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
})
