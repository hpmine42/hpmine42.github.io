<script setup lang="ts">
import { aiko } from '../data/content'
import AikoResolver from './AikoResolver.vue'
import ExternalLink from './ExternalLink.vue'
import FactList from './FactList.vue'
</script>

<template>
  <section id="aiko" class="aiko" aria-labelledby="aiko-title">
    <div class="aiko__grid">
      <div class="aiko__head">
        <h2 id="aiko-title" class="aiko__name">{{ aiko.name }}</h2>
        <p class="aiko__lede">{{ aiko.summary }}</p>
        <div class="aiko__actions">
          <ExternalLink :href="aiko.liveUrl" variant="button">Open Aiko</ExternalLink>
          <ExternalLink :href="aiko.repoUrl">Source on GitHub</ExternalLink>
        </div>
      </div>

      <div class="aiko__panel">
        <AikoResolver />
      </div>

      <div class="aiko__facts">
        <FactList :facts="aiko.facts" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.aiko {
  padding: var(--section-y) var(--gutter);
  background: var(--bg);
  color: var(--fg);
}

.aiko__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-template-areas:
    'head head head head head panel panel panel panel panel panel panel'
    'facts facts facts facts facts panel panel panel panel panel panel panel';
  grid-template-rows: auto 1fr;
  column-gap: clamp(1rem, 3vw, 2.5rem);
  row-gap: clamp(2.5rem, 6vw, 4rem);
  max-width: var(--content-max);
  margin-inline: auto;
}

.aiko__head {
  grid-area: head;
}

.aiko__panel {
  grid-area: panel;
  align-self: start;
}

.aiko__facts {
  grid-area: facts;
  align-self: end;
}

.aiko__name {
  margin-bottom: clamp(1.5rem, 3vw, 2.25rem);
  font-family: var(--font-mono);
  font-size: clamp(3.75rem, 14vw, 10.5rem);
  font-weight: 500;
  line-height: 0.9;
  letter-spacing: -0.07em;
}

.aiko__lede {
  max-width: 24em;
  font-size: var(--step-1);
  line-height: 1.3;
  letter-spacing: -0.015em;
}

.aiko__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.75rem;
  margin-top: 2.25rem;
}

@media (max-width: 60rem) {
  .aiko__grid {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'head'
      'panel'
      'facts';
    grid-template-rows: auto;
  }
}
</style>
