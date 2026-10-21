<script setup lang="ts">
/*
  Aiko answers by walking a fixed sequence of stages until one claims the
  message. Picking a sample replays that walk.
*/
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { aiko } from '../data/projects'
import { useInView } from '../composables/useInView'
import { usePrefersReducedMotion } from '../composables/usePrefersReducedMotion'

type StageState = 'idle' | 'passed' | 'checking' | 'match'

const STEP_MS = 120
const AUTOPLAY_SAMPLE = 3

const stages = aiko.stages
const samples = aiko.samples
const markers: Record<StageState, string> = {
  idle: '',
  passed: 'pass',
  checking: '···',
  match: 'match',
}

const root = useTemplateRef<HTMLElement>('root')
const reduced = usePrefersReducedMotion()
const inView = useInView(() => root.value, { rootMargin: '0px 0px -30% 0px' })

const selected = ref(-1)
const probe = ref(-1)
const done = ref(false)
let timer = 0

const targetIndex = computed(() => {
  const sample = samples[selected.value]
  return sample ? stages.findIndex((stage) => stage.id === sample.stage) : -1
})

const result = computed(() => {
  const sample = samples[selected.value]
  const stage = stages[targetIndex.value]
  if (!done.value || !sample || !stage) return ''
  return `${sample.input}  →  ${stage.name}`
})

function select(index: number): void {
  window.clearTimeout(timer)
  selected.value = index
  done.value = false
  const target = targetIndex.value
  if (target < 0) return

  if (reduced.value) {
    probe.value = target
    done.value = true
    return
  }

  probe.value = 0
  const advance = (): void => {
    if (probe.value >= target) {
      done.value = true
      return
    }
    probe.value += 1
    timer = window.setTimeout(advance, STEP_MS)
  }
  timer = window.setTimeout(advance, STEP_MS)
}

function stateOf(index: number): StageState {
  if (selected.value < 0 || probe.value < 0) return 'idle'
  if (index < probe.value) return 'passed'
  if (index === probe.value) return done.value ? 'match' : 'checking'
  return 'idle'
}

watch(inView, (visible) => {
  if (visible && selected.value === -1) select(AUTOPLAY_SAMPLE)
})

onBeforeUnmount(() => window.clearTimeout(timer))
</script>

<template>
  <div ref="root" class="trace">
    <p class="trace__label label" id="trace-inputs">try a message</p>
    <div class="trace__inputs" role="group" aria-labelledby="trace-inputs">
      <button
        v-for="(sample, index) in samples"
        :key="sample.input"
        type="button"
        class="trace__chip"
        :aria-pressed="selected === index ? 'true' : 'false'"
        @click="select(index)"
      >
        {{ sample.input }}
      </button>
    </div>

    <ol class="trace__stages" aria-label="Aiko engine, in evaluation order">
      <li
        v-for="(stage, index) in stages"
        :key="stage.id"
        class="trace__stage"
        :data-state="stateOf(index)"
      >
        <span class="trace__n" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="trace__name">{{ stage.name }}</span>
        <span class="trace__note">{{ stage.note }}</span>
        <span class="trace__marker" aria-hidden="true">{{ markers[stateOf(index)] }}</span>
      </li>
    </ol>

    <p class="trace__out" aria-live="polite">
      <span v-if="result">{{ result }}</span>
    </p>
    <p class="trace__caption">
      Stage order from the Aiko engine. Samples from its README.
    </p>
  </div>
</template>

<style scoped>
.trace {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.trace__inputs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-1);
  margin-top: var(--s-2);
}

.trace__chip {
  padding: 0.55rem 0.8rem;
  font-family: var(--font-mono);
  font-size: var(--text-ui);
  line-height: 1.2;
  color: var(--bone);
  background: transparent;
  border: 1px solid var(--ink-line);
  border-radius: 2px;
  cursor: pointer;
  transition:
    border-color var(--dur-fast) ease,
    color var(--dur-fast) ease,
    background-color var(--dur-fast) ease;
}

.trace__chip[aria-pressed='true'] {
  color: var(--amber);
  border-color: var(--amber);
  background: var(--amber-wash);
}

@media (hover: hover) {
  .trace__chip:hover {
    border-color: var(--bone-dim);
  }

  .trace__chip[aria-pressed='true']:hover {
    border-color: var(--amber);
  }
}

.trace__stages {
  position: relative;
  margin-top: var(--s-5);
  border-bottom: 1px solid var(--ink-line);
}

.trace__stage {
  position: relative;
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr) auto 3.5rem;
  align-items: baseline;
  gap: var(--s-2);
  padding: 0.7rem 0.75rem;
  border-top: 1px solid var(--ink-line);
  transition:
    background-color var(--dur-fast) ease,
    color var(--dur-fast) ease;
}

.trace__stage::before {
  content: '';
  position: absolute;
  left: 0;
  top: -1px;
  bottom: -1px;
  width: 2px;
  background: var(--amber);
  transform: scaleY(0);
  transition: transform var(--dur-fast) var(--ease-out);
}

.trace__n,
.trace__note,
.trace__marker {
  font-family: var(--font-mono);
  font-size: var(--text-ui);
  color: var(--bone-dim);
}

.trace__name {
  font-weight: 600;
  transition: color var(--dur-fast) ease;
}

.trace__marker {
  text-align: right;
}

.trace__stage[data-state='passed'] .trace__name {
  color: var(--bone-dim);
  text-decoration: line-through;
  text-decoration-thickness: 1px;
  text-decoration-color: var(--ink-line);
}

.trace__stage[data-state='checking']::before {
  transform: scaleY(0.5);
}

.trace__stage[data-state='checking'] .trace__name {
  color: var(--amber);
}

.trace__stage[data-state='match'] {
  background: var(--amber-wash);
}

.trace__stage[data-state='match']::before {
  transform: scaleY(1);
}

.trace__stage[data-state='match'] .trace__name,
.trace__stage[data-state='match'] .trace__n,
.trace__stage[data-state='match'] .trace__marker {
  color: var(--amber);
}

.trace__out {
  min-height: 1.6em;
  margin-top: var(--s-3);
  font-family: var(--font-mono);
  font-size: var(--text-ui);
  color: var(--amber);
  white-space: pre-wrap;
}

.trace__caption {
  margin-top: var(--s-1);
  font-size: var(--text-ui);
  color: var(--bone-dim);
}

@media (max-width: 30rem) {
  .trace__stage {
    grid-template-columns: 2rem minmax(0, 1fr) 3.25rem;
    padding-inline: 0.6rem;
  }

  .trace__note {
    display: none;
  }
}
</style>
