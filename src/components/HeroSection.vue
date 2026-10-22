<script setup lang="ts">
import { profile } from '../data/content'
import DotField from './DotField.vue'
</script>

<template>
  <section id="top" class="hero" aria-labelledby="hero-title">
    <DotField :text="profile.name" />
    <h1 id="hero-title" class="sr-only">{{ profile.name }}</h1>
    <div class="hero__foot">
      <div class="hero__lead">
        <p class="hero__role">{{ profile.role }}</p>
        <p class="hero__hint">Move your pointer across the name</p>
      </div>
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
  gap: 0.5rem 2rem;
  max-width: var(--content-max);
  margin-inline: auto;
  padding: 0 var(--gutter) clamp(1.5rem, 4vh, 2.5rem);
  pointer-events: none;
}

.hero__lead {
  display: grid;
  gap: 0.35rem;
}

/* Only makes sense with a mouse; touch devices never see it. */
.hero__hint {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.02em;
  color: var(--fg-muted);
}

@media (pointer: coarse) {
  .hero__hint {
    display: none;
  }
}

.hero__role {
  font-size: var(--step-1);
  line-height: 1.2;
  letter-spacing: -0.015em;
  color: var(--fg);
}
</style>
