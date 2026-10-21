<script setup lang="ts">
import type { Fact } from '../data/content'

defineProps<{ facts: readonly Fact[] }>()
</script>

<template>
  <dl class="facts">
    <div v-for="fact in facts" :key="fact.label" class="facts__row">
      <dt class="facts__label">{{ fact.label }}</dt>
      <dd class="facts__value">{{ fact.value }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.facts {
  border-bottom: 1px solid var(--rule);
}

.facts__row {
  display: grid;
  grid-template-columns: minmax(6.5rem, 9rem) 1fr;
  gap: 0.25rem 1rem;
  padding: 0.9rem 0;
  border-top: 1px solid var(--rule);
  font-size: var(--step--1);
  line-height: 1.5;
}

.facts__label {
  color: var(--fg-muted);
}

.facts__value {
  margin: 0;
  color: var(--fg);
}

@media (max-width: 30rem) {
  .facts__row {
    grid-template-columns: 1fr;
  }
}
</style>
