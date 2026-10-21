import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Served from the root of https://hpmine42.github.io/ (user site, no subpath).
export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: {
    target: 'es2022',
    cssCodeSplit: false,
  },
})
