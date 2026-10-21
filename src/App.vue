<script setup lang="ts">
import { sections } from './data/content'
import { useActiveSection } from './composables/useActiveSection'
import HeroSection from './components/HeroSection.vue'
import ProjectEnough from './components/ProjectEnough.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'

const active = useActiveSection(sections.map((section) => section.id))
</script>

<template>
  <a class="skip-link" href="#enough">Skip to projects</a>
  <SiteHeader :active="active" />
  <main>
    <HeroSection />
    <ProjectEnough />
  </main>
  <SiteFooter />
</template>
