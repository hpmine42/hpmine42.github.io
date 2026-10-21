<script setup lang="ts">
import { profile } from '../data/content'
import DotField from './DotField.vue'
</script>

<template>
  <section id="top" class="hero" aria-labelledby="hero-title">
    <DotField :text="profile.name" />
    <h1 id="hero-title" class="sr-only">{{ profile.name }}</h1>
    <div class="hero__foot">
      <p class="hero__role">{{ profile.role }}</p>
      <a class="hero__cue" href="#enough">enough.</a>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100vh;
  min-height: 100svh;
  overflow: hidden;
  touch-action: pan-y;
}

.hero__foot {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 2rem;
  max-width: var(--content-max);
  margin-inline: auto;
  padding: 0 var(--gutter) clamp(1.5rem, 4vh, 2.5rem);
  pointer-events: none;
}

.hero__role {
  font-size: var(--step-1);
  line-height: 1.2;
  letter-spacing: -0.015em;
  color: var(--fg);
}

.hero__cue {
  font-size: var(--step--1);
  color: var(--fg-muted);
  text-decoration: none;
  pointer-events: auto;
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 100% 1px;
  padding-bottom: 0.15em;
  transition:
    color 0.25s var(--ease-out),
    background-size 0.35s var(--ease-out);
}

.hero__cue:hover,
.hero__cue:focus-visible {
  color: var(--fg);
  background-size: 0 1px;
  background-position: 100% 100%;
}
</style>
