<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { usePrefersReducedMotion } from '../composables/usePrefersReducedMotion'
import { scramble } from '../utils/glyphs'

const props = withDefaults(
  defineProps<{
    text: string
    delay?: number
    duration?: number
  }>(),
  { delay: 0, duration: 900 },
)

const reduced = usePrefersReducedMotion()
const shown = ref(props.text)
let frame = 0
let timeout = 0

function play(): void {
  const start = performance.now()
  let lastSwap = 0
  const tick = (now: number): void => {
    const progress = Math.min(1, (now - start) / props.duration)
    if (now - lastSwap > 45 || progress === 1) {
      lastSwap = now
      const settled = Math.floor(progress * props.text.length)
      shown.value = props.text.slice(0, settled) + scramble(props.text.slice(settled))
    }
    frame = progress < 1 ? requestAnimationFrame(tick) : 0
  }
  frame = requestAnimationFrame(tick)
}

onMounted(() => {
  if (reduced.value) return
  shown.value = scramble(props.text)
  timeout = window.setTimeout(play, props.delay)
})

onBeforeUnmount(() => {
  window.clearTimeout(timeout)
  if (frame) cancelAnimationFrame(frame)
})
</script>

<template>
  <span class="scramble">
    <span class="visually-hidden">{{ text }}</span>
    <span aria-hidden="true">{{ shown }}</span>
  </span>
</template>

<style scoped>
.scramble {
  font-family: var(--font-mono);
  white-space: pre;
}
</style>
