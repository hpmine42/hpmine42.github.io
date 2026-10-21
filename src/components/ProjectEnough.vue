<script setup lang="ts">
import { computed, ref } from 'vue'
import { enough } from '../data/content'
import { useReducedMotion } from '../composables/useReducedMotion'
import { useScrollProgressVar } from '../composables/useScrollProgressVar'
import EnoughThread from './EnoughThread.vue'
import ExternalLink from './ExternalLink.vue'
import FactList from './FactList.vue'

const reduced = useReducedMotion()
const word = ref<HTMLElement | null>(null)

// The title gets lighter as it scrolls into place: less, but enough.
useScrollProgressVar(
  word,
  '--p',
  computed(() => !reduced.value),
)
</script>

<template>
  <section id="enough" class="enough" aria-labelledby="enough-title">
    <div class="enough__inner">
      <h2 id="enough-title" ref="word" class="enough__word">{{ enough.name }}</h2>

      <div class="enough__grid">
        <div class="enough__intro">
          <p class="enough__lede">{{ enough.summary }}</p>
          <div class="enough__actions">
            <ExternalLink :href="enough.liveUrl" variant="button">Open enough.</ExternalLink>
            <ExternalLink :href="enough.repoUrl">Source on GitHub</ExternalLink>
          </div>
        </div>

        <div class="enough__visual">
          <EnoughThread />
          <FactList :facts="enough.facts" />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.enough {
  --bg: var(--chalk);
  --fg: var(--chalk-ink);
  --fg-muted: var(--chalk-muted);
  --rule: var(--chalk-line);
  --rule-strong: #8b9399;
  --focus: var(--chalk-focus);
  --accent: var(--chalk-focus);

  overflow-x: clip;
  padding: var(--section-y) var(--gutter);
  background: var(--bg);
  color: var(--fg);
}

.enough__inner {
  max-width: var(--content-max);
  margin-inline: auto;
}

.enough__word {
  --p: 1;
  margin: 0 0 clamp(3rem, 8vw, 7rem) -0.04em;
  font-size: clamp(4rem, 23vw, 19rem);
  font-weight: calc(650 - 450 * var(--p));
  line-height: 0.85;
  letter-spacing: -0.055em;
}

.enough__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: clamp(1rem, 3vw, 2.5rem);
  row-gap: clamp(3rem, 8vw, 5rem);
}

.enough__intro {
  grid-column: 1 / span 5;
}

.enough__visual {
  grid-column: 7 / span 6;
  display: grid;
  gap: clamp(2rem, 4vw, 3rem);
}

.enough__lede {
  max-width: 22em;
  font-size: var(--step-1);
  line-height: 1.3;
  letter-spacing: -0.015em;
}

.enough__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.75rem;
  margin-top: 2.25rem;
}

@media (max-width: 52rem) {
  .enough__intro,
  .enough__visual {
    grid-column: 1 / -1;
  }
}
</style>
