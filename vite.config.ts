import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The site lives at the root of https://hpmine42.github.io/, so the base is "/".
export default defineConfig({
  base: '/',
  plugins: [vue()],
  // Dev only: accept whatever host the dev server is reached through
  // (localhost, a tunnel, a container preview). The build is unaffected.
  server: { allowedHosts: true },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
})
