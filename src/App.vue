<script setup lang="ts">
import { watchEffect } from 'vue'
import SiteNav from './components/SiteNav.vue'
import HeroSection from './components/HeroSection.vue'
import ProjectEnough from './components/ProjectEnough.vue'
import ProjectAiko from './components/ProjectAiko.vue'
import SiteFooter from './components/SiteFooter.vue'
import { useActiveScene } from './composables/useActiveScene'

const activeScene = useActiveScene()

// The page changes its surface as each project takes the centre of the viewport.
watchEffect(() => {
  document.documentElement.dataset.scene = activeScene.value
})
</script>

<template>
  <a class="skip-link" href="#enough">Skip to projects</a>
  <SiteNav :active="activeScene" />
  <main>
    <HeroSection />
    <ProjectEnough />
    <ProjectAiko />
  </main>
  <SiteFooter />
</template>
