<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  resolverDefault,
  resolverSamples,
  resolverStages,
  type ResolverSample,
} from '../data/content'
import { useReducedMotion } from '../composables/useReducedMotion'

/*
  Aiko answers by walking a fixed list of stages and stopping at the first
  one that can answer. The same input always takes the same path. This panel
  replays that walk for a few example inputs.
*/

const STEP_MS = 130
const SETTLE_MS = 220

const reduced = useReducedMotion()
const root = ref<HTMLElement | null>(null)
const selected = ref<ResolverSample>(resolverDefault)
const cursor = ref(0)
const finished = ref(false)

let timer = 0
let observer: IntersectionObserver | null = null

const announcement = computed(() => {
  if (!finished.value) return ''
  const name = resolverStages[selected.value.stage - 1] ?? ''
  return `Answered at stage ${selected.value.stage}, ${name}. ${selected.value.result}`
})

type RowState = 'pending' | 'checking' | 'skipped' | 'matched' | 'unreached'

function rowState(stage: number): RowState {
  if (finished.value) {
    if (stage < selected.value.stage) return 'skipped'
    return stage === selected.value.stage ? 'matched' : 'unreached'
  }
  if (stage < cursor.value) return 'skipped'
  return stage === cursor.value ? 'checking' : 'pending'
}

function stateLabel(state: RowState): string {
  if (state === 'skipped') return 'no match'
  if (state === 'matched') return 'answers'
  return ''
}

function advance(): void {
  cursor.value += 1
  if (cursor.value >= selected.value.stage) {
    timer = window.setTimeout(() => {
      finished.value = true
    }, SETTLE_MS)
    return
  }
  timer = window.setTimeout(advance, STEP_MS)
}

function start(): void {
  window.clearTimeout(timer)
  finished.value = false
  cursor.value = 0
  if (reduced.value) {
    cursor.value = selected.value.stage
    finished.value = true
    return
  }
  timer = window.setTimeout(advance, STEP_MS)
}

function select(sample: ResolverSample): void {
  selected.value = sample
  start()
}

onMounted(() => {
  const element = root.value
  if (!element) return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      observer?.disconnect()
      start()
    },
    { threshold: 0.5 },
  )
  observer.observe(element)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.clearTimeout(timer)
})
</script>

<template>
  <div ref="root" class="resolver">
    <div class="resolver__head" role="group" aria-labelledby="resolver-label">
      <p id="resolver-label" class="resolver__label">Pick an input</p>
      <div class="resolver__chips">
        <button
          v-for="sample in resolverSamples"
          :key="sample.input"
          class="resolver__chip"
          type="button"
          :aria-pressed="selected.input === sample.input"
          @click="select(sample)"
        >
          {{ sample.input }}
        </button>
      </div>
    </div>

    <ol class="resolver__stages">
      <li
        v-for="(name, index) in resolverStages"
        :key="name"
        class="stage"
        :class="`stage--${rowState(index + 1)}`"
      >
        <span class="stage__n">{{ index + 1 }}</span>
        <span class="stage__name">{{ name }}</span>
        <span class="stage__state">{{ stateLabel(rowState(index + 1)) }}</span>
      </li>
    </ol>

    <p class="resolver__result" :class="{ 'resolver__result--on': finished }">
      <span v-if="finished">{{ selected.result }}</span>
    </p>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>

<style scoped>
.resolver {
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  font-family: var(--font-mono);
  font-size: var(--step--1);
}

.resolver__head {
  padding: 1rem;
  border-bottom: 1px solid var(--rule);
}

.resolver__label {
  margin-bottom: 0.75rem;
  color: var(--fg-muted);
  font-family: var(--font-sans);
}

.resolver__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.resolver__chip {
  min-height: 2.75rem;
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  background: transparent;
  font-family: var(--font-mono);
  font-size: inherit;
  cursor: pointer;
  transition:
    background-color 0.2s var(--ease-out),
    border-color 0.2s var(--ease-out),
    color 0.2s var(--ease-out);
}

.resolver__chip:hover {
  border-color: var(--fg);
}

.resolver__chip[aria-pressed='true'] {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--graphite);
}

.resolver__stages {
  counter-reset: none;
}

.stage {
  display: grid;
  grid-template-columns: 2ch 1fr auto;
  gap: 1rem;
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--rule);
  color: var(--fg-muted);
  transition:
    background-color 0.2s var(--ease-out),
    color 0.2s var(--ease-out),
    opacity 0.3s var(--ease-out);
}

.stage__n {
  font-variant-numeric: tabular-nums;
}

.stage--pending {
  opacity: 0.6;
}

.stage--checking {
  color: var(--fg);
  box-shadow: inset 2px 0 0 var(--accent);
  background: var(--graphite-raised);
}

.stage--matched {
  background: var(--accent);
  color: var(--graphite);
}

.stage--unreached {
  opacity: 0.3;
}

.resolver__result {
  min-height: 4.25rem;
  padding: 1rem;
  font-family: var(--font-sans);
  font-size: var(--step-1);
  line-height: 1.3;
  letter-spacing: -0.015em;
  color: var(--fg);
}

@media (max-width: 30rem) {
  .stage {
    gap: 0.75rem;
    padding-inline: 0.75rem;
  }
}
</style>
