<script setup lang="ts">
import type { Fact } from '../data/projects'

withDefaults(
  defineProps<{
    facts: readonly Fact[]
    variant?: 'rows' | 'inline'
  }>(),
  { variant: 'rows' },
)
</script>

<template>
  <dl class="facts" :class="`facts--${variant}`">
    <div v-for="fact in facts" :key="fact.label" class="facts__item">
      <dt class="facts__label">{{ fact.label }}</dt>
      <dd class="facts__value">{{ fact.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.facts__label {
  font-family: var(--font-mono);
  font-size: var(--text-ui);
  color: var(--scene-muted);
  transition: color var(--dur-scene) var(--ease-in-out);
}

.facts__value {
  margin: 0;
}

/* Rows: a quiet specification sheet. */
.facts--rows .facts__item {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: var(--s-3);
  align-items: baseline;
  padding-block: 0.8rem;
  border-top: 1px solid var(--scene-line);
  transition: border-color var(--dur-scene) var(--ease-in-out);
}

.facts--rows .facts__item:last-child {
  border-bottom: 1px solid var(--scene-line);
}

/* Inline: compact key/value lines, the way a config reads. */
.facts--inline {
  display: grid;
  gap: 0.55rem;
}

.facts--inline .facts__item {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr);
  gap: var(--s-2);
  align-items: baseline;
}

.facts--inline .facts__label {
  color: var(--amber-dim);
}

.facts--inline .facts__label::after {
  content: ':';
}

@media (max-width: 30rem) {
  .facts--rows .facts__item {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.15rem;
  }
}
</style>
