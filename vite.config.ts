import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// The site lives at the root of https://hpmine42.github.io/, so the base is "/".
export default defineConfig({
  base: '/',
  plugins: [vue()],
  build: {
    target: 'es2022',
    sourcemap: false,
  },
})
