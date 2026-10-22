<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useReducedMotion } from '../composables/useReducedMotion'

/*
  The one idea behind enough., shown as what it is: a chat between two people.
  The message leaves as noise — the outgoing bubble carries ciphertext — and
  only becomes readable in the bubble on the other side, character by
  character, once it has arrived. Plays once when it scrolls into view; the
  small round button replays it.
*/

const PLAIN = 'less, but enough.'
const GLYPHS = '0123456789abcdef'
const TRAVEL_MS = 1200
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
const cipher = ref(scramble(24))

let timer = 0
let churn = 0
let frame = 0
let observer: IntersectionObserver | null = null

function clearTimers(): void {
  window.clearTimeout(timer)
  window.clearInterval(churn)
  cancelAnimationFrame(frame)
}

function startCipher(): void {
  window.clearInterval(churn)
  churn = window.setInterval(() => {
    if (document.hidden) return
    cipher.value = scramble(24)
  }, 110)
}

function decrypt(): void {
  window.clearInterval(churn)
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
  cipher.value = scramble(24)
  startCipher()
  // Two frames, so the bubbles snap back to their starting state first.
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
      observer = null
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
    <div class="thread__log">
      <!-- Outgoing: the message as it leaves, nothing but noise. -->
      <div class="thread__row thread__row--out">
        <span class="thread__bubble thread__bubble--out" aria-hidden="true">
          <span class="thread__cipher">{{ cipher }}</span>
        </span>
        <span class="thread__tag" aria-hidden="true">
          <template v-if="phase === 'done'">
            <svg class="thread__tick" viewBox="0 0 18 12" width="16" height="11" focusable="false">
              <path
                d="M1 6.5 4.2 9.5 10 2M7 6.5 10.2 9.5 16 2"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            delivered
          </template>
          <template v-else>encrypted</template>
        </span>
      </div>

      <!-- Incoming: the same message, readable only once it has arrived. -->
      <div class="thread__row thread__row--in">
        <span class="thread__avatar" aria-hidden="true">T</span>
        <span class="thread__bubble thread__bubble--in">
          <span class="sr-only">{{ PLAIN }}</span>
          <span aria-hidden="true">{{ shown }}</span>
        </span>
      </div>
    </div>

    <figcaption class="thread__caption">
      <span class="thread__status">
        <svg class="thread__lock" viewBox="0 0 14 14" width="13" height="13" aria-hidden="true" focusable="false">
          <path
            d="M4 6V4.5a3 3 0 0 1 6 0V6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linecap="round"
          />
          <rect x="2.6" y="6" width="8.8" height="6.2" rx="1.4" fill="none" stroke="currentColor" stroke-width="1.3" />
        </svg>
        End-to-end encrypted
      </span>

      <button class="thread__replay" type="button" :disabled="reduced" @click="run">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
          <path
            d="M13 8a5 5 0 1 1-1.6-3.7M13 2.4V5h-2.6"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span class="sr-only">Replay the encryption animation</span>
      </button>
    </figcaption>
  </figure>
</template>

<style scoped>
.thread {
  display: grid;
  gap: 0.75rem;
}

.thread__log {
  display: grid;
  gap: 0.75rem;
}

.thread__row {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  min-height: 2.6rem;
}

.thread__row--out {
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.thread__bubble {
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  max-width: 100%;
  padding: 0.6rem 0.85rem;
  border-radius: 14px;
  font-family: var(--font-mono);
  font-size: 0.9375rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

/* Outgoing: dim, monospace noise, nudged in from the right. */
.thread__bubble--out {
  border: 1px solid var(--rule-strong);
  background: rgba(24, 27, 30, 0.75);
  color: rgba(138, 162, 255, 0.6);
  border-bottom-right-radius: 4px;
  opacity: 0;
  transform: translateX(0.6rem);
  transition:
    opacity 0.3s var(--ease-out),
    transform 0.35s var(--ease-out),
    color 0.4s linear;
}

.thread[data-phase='sending'] .thread__bubble--out,
.thread[data-phase='decrypting'] .thread__bubble--out,
.thread[data-phase='done'] .thread__bubble--out {
  opacity: 1;
  transform: none;
}

.thread[data-phase='decrypting'] .thread__bubble--out,
.thread[data-phase='done'] .thread__bubble--out {
  color: rgba(138, 162, 255, 0.35);
}

.thread__cipher {
  font-size: 0.8125rem;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
}

.thread__tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-muted);
  white-space: nowrap;
}

.thread__tag:empty {
  display: none;
}

.thread__tick {
  color: var(--accent);
}

/* Incoming: starts as noise, resolves into the sentence. */
.thread__avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  margin-bottom: 0.15rem;
  border-radius: 50%;
  border: 1px solid var(--rule-strong);
  background: rgba(24, 27, 30, 0.85);
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--fg-muted);
}

.thread__bubble--in {
  min-height: 2.6rem;
  border: 1px solid var(--rule);
  background: linear-gradient(180deg, rgba(30, 34, 39, 0.95), rgba(22, 25, 28, 0.95));
  color: var(--fg-muted);
  border-bottom-left-radius: 4px;
  transition:
    color 0.45s linear,
    border-color 0.45s linear,
    box-shadow 0.45s linear;
}

.thread[data-phase='done'] .thread__bubble--in {
  color: var(--fg);
  border-color: rgba(138, 162, 255, 0.45);
  box-shadow: 0 0 1.75rem -0.35rem rgba(138, 162, 255, 0.45);
}

.thread__caption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.6rem;
  border-top: 1px solid var(--rule);
  font-size: var(--step--1);
  color: var(--fg-muted);
}

.thread__status {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
}

.thread__lock {
  flex: none;
  color: var(--accent);
  opacity: 0.8;
}

/* Always there, just quiet while the animation runs — it never pops in. */
.thread__replay {
  display: inline-grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: 1px solid var(--rule-strong);
  border-radius: 50%;
  background: none;
  color: var(--fg-muted);
  cursor: pointer;
  transition:
    color 0.25s var(--ease-out),
    border-color 0.25s var(--ease-out),
    opacity 0.3s linear;
  opacity: 0.45;
}

.thread[data-phase='done'] .thread__replay {
  opacity: 1;
}

.thread__replay:hover,
.thread__replay:focus-visible {
  color: var(--fg);
  border-color: var(--accent);
  opacity: 1;
}

.thread__replay:disabled {
  cursor: default;
  opacity: 0.2;
}
</style>
