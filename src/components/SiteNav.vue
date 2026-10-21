<script setup lang="ts">
import type { SceneId } from '../composables/useActiveScene'
import { links } from '../data/projects'

defineProps<{
  active: SceneId
}>()
</script>

<template>
  <header class="nav">
    <a class="nav__mark" href="#top">
      <span>Jakob</span><span class="nav__caret" aria-hidden="true"></span>
      <span class="visually-hidden">, back to top</span>
    </a>
    <nav aria-label="Sections">
      <ul class="nav__list">
        <li>
          <a
            class="nav__link"
            href="#enough"
            :aria-current="active === 'enough' ? 'location' : undefined"
          >enough.</a>
        </li>
        <li>
          <a
            class="nav__link"
            href="#aiko"
            :aria-current="active === 'aiko' ? 'location' : undefined"
          >Aiko</a>
        </li>
        <li>
          <a class="nav__link" :href="links.github" target="_blank" rel="me noopener noreferrer">
            GitHub<span aria-hidden="true">&nbsp;↗</span>
            <span class="visually-hidden"> (opens in a new tab)</span>
          </a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<style scoped>
.nav {
  position: fixed;
  inset: 0 0 auto;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  height: var(--nav-h);
  padding-inline: var(--gutter);
  font-family: var(--font-mono);
  font-size: var(--text-ui);
  color: var(--scene-fg);
  background-color: var(--scene-bg);
  transition:
    background-color var(--dur-scene) var(--ease-in-out),
    color var(--dur-scene) var(--ease-in-out);
}

.nav__mark {
  display: inline-flex;
  align-items: center;
  gap: 0.2em;
  font-weight: 600;
}

.nav__caret {
  display: inline-block;
  width: 0.5em;
  height: 1.1em;
  background: var(--signal);
}

.nav__list {
  display: flex;
  gap: clamp(1rem, 0.5rem + 2vw, 2.25rem);
}

.nav__link {
  position: relative;
  display: inline-block;
  padding-block: 0.5rem;
  color: var(--scene-muted);
  transition: color var(--dur-fast) ease;
}

.nav__link::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.3rem;
  height: 1px;
  background: var(--scene-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform var(--dur-mid) var(--ease-out);
}

.nav__link[aria-current='location'] {
  color: var(--scene-fg);
}

.nav__link[aria-current='location']::after {
  transform: scaleX(1);
}

@media (hover: hover) {
  .nav__link:hover {
    color: var(--scene-fg);
  }
}
</style>
