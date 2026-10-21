<script setup lang="ts">
import { profile, sections } from '../data/content'

defineProps<{ active: string }>()
</script>

<template>
  <header class="site-header">
    <nav class="site-header__nav" aria-label="Primary">
      <ul class="site-header__list">
        <li v-for="item in sections" :key="item.id">
          <a
            class="site-header__link"
            :class="{ 'site-header__link--brand': item.id === 'top' }"
            :href="`#${item.id}`"
            :aria-current="active === item.id ? 'location' : undefined"
          >
            {{ item.label }}
          </a>
        </li>
        <li>
          <a
            class="site-header__link"
            :href="profile.githubUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub<span class="sr-only"> (opens in a new tab)</span>
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
/*
  White text with mix-blend-mode: difference inverts itself over the chalk
  surface, so one header works on both dark and light sections.
*/
.site-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  padding: 1rem var(--gutter);
  color: #fff;
  mix-blend-mode: difference;
  pointer-events: none;
}

.site-header__list {
  display: flex;
  align-items: baseline;
  gap: clamp(1.1rem, 3vw, 2rem);
  max-width: var(--content-max);
  margin-inline: auto;
}

.site-header__list > li:first-child {
  margin-right: auto;
}

.site-header__link {
  position: relative;
  display: inline-block;
  padding-block: 0.4rem;
  font-size: var(--step--1);
  font-weight: 500;
  color: inherit;
  text-decoration: none;
  pointer-events: auto;
}

.site-header__link--brand {
  font-weight: 650;
  letter-spacing: -0.01em;
}

.site-header__link::after {
  content: '';
  position: absolute;
  inset: auto 0 0.2rem 0;
  height: 1px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.35s var(--ease-out);
}

.site-header__link:hover::after,
.site-header__link:focus-visible::after,
.site-header__link[aria-current='location']:not(.site-header__link--brand)::after {
  transform: scaleX(1);
}

.site-header__link:focus-visible {
  outline-color: #fff;
}
</style>
