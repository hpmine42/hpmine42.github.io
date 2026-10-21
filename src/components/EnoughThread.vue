<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useReducedMotion } from '../composables/useReducedMotion'

/*
  The one idea behind enough.: a message travels between exactly two people
  and is only readable at the end. A packet crosses the line as ciphertext,
  then the text resolves character by character on arrival.
*/

const PLAIN = 'less, but enough.'
const GLYPHS = '0123456789abcdef'
const TRAVEL_MS = 1500
const DECRYPT_MS = 1100

type Phase = 'idle' | 'sending' | 'decrypting' | 'done'

function scramble(length: number): string {
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length))
  }
  return out
}

const reduced = useReducedMotion()
const root = ref<HTMLElement | null>(null)
const phase = ref<Phase>('idle')
const shown = ref(scramble(PLAIN.length))

let timer = 0
let frame = 0
let observer: IntersectionObserver | null = null

function clearTimers(): void {
  window.clearTimeout(timer)
  cancelAnimationFrame(frame)
}

function decrypt(): void {
  phase.value = 'decrypting'
  const start = performance.now()
  let lastPaint = 0
  const tick = (now: number): void => {
    const progress = Math.min(1, (now - start) / DECRYPT_MS)
    if (progress >= 1) {
      shown.value = PLAIN
      phase.value = 'done'
      return
    }
    if (now - lastPaint > 45) {
      lastPaint = now
      const revealed = Math.floor(progress * PLAIN.length)
      shown.value = PLAIN.slice(0, revealed) + scramble(PLAIN.length - revealed)
    }
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

function run(): void {
  clearTimers()
  if (reduced.value) {
    shown.value = PLAIN
    phase.value = 'done'
    return
  }
  phase.value = 'idle'
  shown.value = scramble(PLAIN.length)
  // Two frames, so the packet snaps back to the start before it travels again.
  frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      phase.value = 'sending'
      timer = window.setTimeout(decrypt, TRAVEL_MS)
    })
  })
}

onMounted(() => {
  const element = root.value
  if (!element) return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry?.isIntersecting) return
      observer?.disconnect()
      run()
    },
    { threshold: 0.6 },
  )
  observer.observe(element)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimers()
})
</script>

<template>
  <figure ref="root" class="thread" :data-phase="phase">
    <div class="thread__track" aria-hidden="true">
      <span class="thread__node" />
      <span class="thread__line"><span class="thread__packet" /></span>
      <span class="thread__node" />
    </div>
    <div class="thread__names" aria-hidden="true">
      <span>you</span>
      <span>them</span>
    </div>

    <p class="thread__message">
      <span class="sr-only">{{ PLAIN }}</span>
      <span aria-hidden="true">{{ shown }}</span>
    </p>

    <figcaption class="thread__caption">
      <span>End-to-end encrypted</span>
      <button
        class="thread__replay"
        type="button"
        :hidden="phase !== 'done' || reduced"
        @click="run"
      >
        Replay<span class="sr-only"> the encryption animation</span>
      </button>
    </figcaption>
  </figure>
</template>

<style scoped>
.thread {
  padding-bottom: 0.5rem;
}

.thread__track {
  display: flex;
  align-items: center;
}

.thread__node {
  flex: none;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: var(--fg);
}

.thread__line {
  position: relative;
  flex: 1;
  height: 1px;
  background: var(--rule-strong);
}

.thread__packet {
  position: absolute;
  top: 50%;
  left: 0;
  width: 0.5rem;
  height: 0.5rem;
  margin-top: -0.25rem;
  border-radius: 50%;
  background: var(--accent);
  opacity: 0;
}

.thread[data-phase='sending'] .thread__packet {
  left: calc(100% - 0.5rem);
  opacity: 1;
  transition:
    left 1.5s var(--ease-in-out),
    opacity 0.15s linear;
}

.thread[data-phase='decrypting'] .thread__packet,
.thread[data-phase='done'] .thread__packet {
  left: calc(100% - 0.5rem);
  opacity: 0;
  transition: opacity 0.4s linear;
}

.thread__names {
  display: flex;
  justify-content: space-between;
  margin-top: 0.6rem;
  font-size: var(--step--1);
  color: var(--fg-muted);
}

.thread__message {
  min-height: 1.4em;
  margin-top: clamp(2rem, 5vw, 3.5rem);
  font-family: var(--font-mono);
  font-size: clamp(1.25rem, 0.9rem + 1.9vw, 2.125rem);
  font-weight: 400;
  line-height: 1.3;
  letter-spacing: -0.02em;
  overflow-wrap: anywhere;
  color: var(--fg-muted);
  transition: color 0.4s linear;
}

.thread[data-phase='done'] .thread__message {
  color: var(--fg);
}

.thread__caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.75rem;
  margin-top: 0.75rem;
  font-size: var(--step--1);
  color: var(--fg-muted);
}

.thread__replay {
  min-height: 2.75rem;
  padding: 0 0.25rem;
  border: 0;
  background: none;
  color: var(--fg);
  font-size: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 0.25em;
  text-decoration-thickness: 1px;
}

.thread__replay[hidden] {
  display: none;
}
</style>
