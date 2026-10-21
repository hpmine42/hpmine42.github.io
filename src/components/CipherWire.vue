<script setup lang="ts">
/*
  enough.'s core idea in one line: the message is readable on both ends,
  and only noise in between. The ciphertext re-scrambles while visible.
*/
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue'
import { useInView } from '../composables/useInView'
import { usePrefersReducedMotion } from '../composables/usePrefersReducedMotion'
import { scramble } from '../utils/glyphs'

const props = defineProps<{
  message: string
}>()

const root = useTemplateRef<HTMLElement>('root')
const reduced = usePrefersReducedMotion()
const inView = useInView(() => root.value, { once: false, rootMargin: '0px' })
const cipher = ref(scramble(props.message, false))
let interval = 0

function startTicker(): void {
  if (interval) return
  interval = window.setInterval(() => {
    cipher.value = scramble(props.message, false)
  }, 140)
}

function stopTicker(): void {
  window.clearInterval(interval)
  interval = 0
}

watch(
  [inView, reduced],
  ([isVisible, isReduced]) => {
    if (isVisible && !isReduced) startTicker()
    else stopTicker()
  },
  { immediate: true },
)

onBeforeUnmount(stopTicker)
</script>

<template>
  <figure ref="root" class="wire" :class="{ 'is-live': inView && !reduced }">
    <div class="wire__end">
      <span class="wire__who">you</span>
      <span class="wire__msg">{{ message }}</span>
    </div>

    <div class="wire__mid" aria-hidden="true">
      <span class="wire__who">server sees</span>
      <span class="wire__cipher">{{ cipher }}</span>
      <span class="wire__track"><span class="wire__pulse"></span></span>
    </div>

    <div class="wire__end wire__end--them">
      <span class="wire__who">them</span>
      <span class="wire__msg">{{ message }}</span>
    </div>

    <figcaption class="visually-hidden">
      End-to-end encryption: the message is readable on both devices, the server relays only
      ciphertext.
    </figcaption>
  </figure>
</template>

<style scoped>
.wire {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1fr);
  align-items: end;
  gap: var(--s-4);
  padding-block: var(--s-5);
}

.wire__end,
.wire__mid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-width: 0;
}

.wire__end--them {
  text-align: right;
}

.wire__who {
  font-family: var(--font-mono);
  font-size: var(--text-ui);
  color: var(--scene-muted);
  transition: color var(--dur-scene) var(--ease-in-out);
}

.wire__msg {
  font-size: var(--text-h3);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.1;
}

.wire__mid {
  text-align: center;
}

.wire__cipher {
  font-family: var(--font-mono);
  font-size: var(--text-lede);
  line-height: 1.1;
  color: var(--scene-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: clip;
  transition: color var(--dur-scene) var(--ease-in-out);
}

.wire__track {
  position: relative;
  display: block;
  height: 1px;
  margin-top: 0.4rem;
  background: currentColor;
  opacity: 0.85;
}

.wire__pulse {
  position: absolute;
  inset: 0;
}

.wire__pulse::before {
  content: '';
  position: absolute;
  left: 0;
  top: -3px;
  width: 7px;
  height: 7px;
  background: var(--signal);
}

.is-live .wire__pulse {
  animation: travel 3.2s var(--ease-in-out) infinite;
}

@keyframes travel {
  0% {
    transform: translateX(0);
  }
  80%,
  100% {
    transform: translateX(calc(100% - 7px));
  }
}

@media (max-width: 48rem) {
  .wire {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--s-4);
    padding-left: var(--s-3);
    border-left: 1px solid currentColor;
  }

  .wire__end--them,
  .wire__mid {
    text-align: left;
  }

  .wire__track {
    display: none;
  }
}
</style>
