<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useReducedMotion } from '../composables/useReducedMotion'

/*
  The background of the enough. section. Instead of a flat surface it is a
  dark field of hexadecimal digits that keeps churning: every tick a small
  share of the cells picks a new character and flashes brighter, then fades
  back into the field. A soft light sits wherever the pointer is, moves with
  a little lag and lights up the numbers underneath it (the light lives in
  its own layer with `mix-blend-mode: screen`, so moving it costs nothing).

  The digits are painted into a canvas only when they actually change (a few
  times per second), never on every animation frame, and only while the
  section is on screen. With prefers-reduced-motion the field is painted
  once and the light stays off.
*/

const canvasEl = ref<HTMLCanvasElement | null>(null)
const lightEl = ref<HTMLElement | null>(null)
const reduced = useReducedMotion()

const GLYPHS = '0123456789abcdef'
const RARE = '/×+-<>_:'
const CELL = 26
const FONT_PX = 13
const CHURN_MS = 120
const FONT_FAMILY = '"Geist Mono Variable", ui-monospace, monospace'
const LIGHT_RADIUS = 260

/* A handful of alpha steps instead of a colour string per cell. */
const TONE_COLORS = [
  'rgba(138, 162, 255, 0.05)',
  'rgba(138, 162, 255, 0.09)',
  'rgba(138, 162, 255, 0.14)',
  'rgba(138, 162, 255, 0.2)',
  'rgba(138, 162, 255, 0.28)',
  'rgba(138, 162, 255, 0.4)',
  'rgba(138, 162, 255, 0.55)',
  'rgba(190, 205, 255, 0.75)',
] as const

let host: HTMLElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let layer: HTMLCanvasElement | null = null
let layerCtx: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let ratio = 1
let cols = 0
let rows = 0
let chars: string[] = []
let tones: Uint8Array = new Uint8Array(0)
let frame = 0
let churnTimer = 0
let resizeTimer = 0
let visible = true
let disposed = false
let resizeObserver: ResizeObserver | null = null
let visibilityObserver: IntersectionObserver | null = null

const light = { x: 0, y: 0, tx: 0, ty: 0, alpha: 0, target: 0, travelled: false }

function randomChar(): string {
  return Math.random() < 0.035
    ? RARE.charAt(Math.floor(Math.random() * RARE.length))
    : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length))
}

function randomTone(): number {
  // Most cells stay deep in the background, a few carry brighter digits.
  const roll = Math.random()
  return roll > 0.94 ? 7 : roll > 0.8 ? 5 : roll > 0.55 ? 4 : roll > 0.3 ? 3 : 2
}

function paintDigits(): void {
  const c = layerCtx
  if (!c || !layer) return
  c.setTransform(ratio, 0, 0, ratio, 0, 0)
  c.clearRect(0, 0, width, height)
  c.font = `${FONT_PX}px ${FONT_FAMILY}`
  c.textAlign = 'center'
  c.textBaseline = 'middle'

  let lastTone = -1
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const i = row * cols + col
      const tone = tones[i] ?? 0
      if (tone <= 0) continue
      if (tone !== lastTone) {
        c.fillStyle = TONE_COLORS[tone] ?? TONE_COLORS[0]
        lastTone = tone
      }
      c.fillText(chars[i] ?? '0', (col + 0.5) * CELL, (row + 0.5) * CELL)
    }
  }
}

function blit(): void {
  const c = ctx
  if (!c || !layer) return
  c.setTransform(1, 0, 0, 1, 0, 0)
  c.clearRect(0, 0, layer.width, layer.height)
  c.drawImage(layer, 0, 0)
}

function churn(): void {
  const count = chars.length
  if (count === 0) return
  // A small share of the field changes at a time; the rest only fades.
  const changes = Math.max(18, Math.round(count * 0.022))
  for (let n = 0; n < changes; n += 1) {
    const i = Math.floor(Math.random() * count)
    chars[i] = randomChar()
    tones[i] = randomTone()
  }
  for (let i = 0; i < count; i += 1) {
    const tone = tones[i] ?? 0
    if (tone > 2 && Math.random() < 0.25) tones[i] = tone - 1
  }
  paintDigits()
  blit()
}

function startChurn(): void {
  window.clearInterval(churnTimer)
  if (reduced.value || disposed) return
  churnTimer = window.setInterval(() => {
    if (!visible || document.hidden) return
    churn()
  }, CHURN_MS)
}

function build(): void {
  const canvas = canvasEl.value
  if (!canvas || !host) return
  const nextWidth = host.clientWidth
  const nextHeight = host.clientHeight
  if (nextWidth === 0 || nextHeight === 0) return

  width = nextWidth
  height = nextHeight
  // The field is a texture, not artwork: half resolution is plenty and keeps
  // the few repaints per second cheap on large screens.
  ratio = Math.min(window.devicePixelRatio || 1, 1.5) * 0.7

  canvas.width = Math.max(1, Math.round(width * ratio))
  canvas.height = Math.max(1, Math.round(height * ratio))
  ctx = canvas.getContext('2d')

  if (!layer) layer = document.createElement('canvas')
  layer.width = canvas.width
  layer.height = canvas.height
  layerCtx = layer.getContext('2d')
  if (!ctx || !layerCtx) return

  cols = Math.ceil(width / CELL)
  rows = Math.ceil(height / CELL)
  const count = cols * rows
  chars = new Array<string>(count)
  tones = new Uint8Array(count)
  for (let i = 0; i < count; i += 1) {
    chars[i] = randomChar()
    tones[i] = randomTone()
  }

  light.x = width * 0.5
  light.y = height * 0.35
  light.tx = light.x
  light.ty = light.y
  moveLight()

  paintDigits()
  blit()
}

function moveLight(): void {
  const el = lightEl.value
  if (!el) return
  el.style.transform = `translate3d(${light.x}px, ${light.y}px, 0)`
  el.style.opacity = light.alpha.toFixed(3)
}

function animateLight(): void {
  frame = 0
  const dx = light.tx - light.x
  const dy = light.ty - light.y
  const distance = Math.hypot(dx, dy)

  if (distance > 0.4) {
    const glide = 0.16
    light.x += dx * glide
    light.y += dy * glide
    light.travelled = true
  } else if (light.travelled) {
    light.x = light.tx
    light.y = light.ty
    light.travelled = false
  }

  light.alpha += (light.target - light.alpha) * 0.12
  if (light.target === 0 && light.alpha < 0.004) light.alpha = 0

  moveLight()

  if (distance > 0.4 || light.travelled || Math.abs(light.target - light.alpha) > 0.004) {
    frame = requestAnimationFrame(animateLight)
  }
}

function kickLight(): void {
  if (frame === 0) frame = requestAnimationFrame(animateLight)
}

function updatePointer(event: PointerEvent): void {
  if (reduced.value || !host) return
  const rect = host.getBoundingClientRect()
  light.tx = event.clientX - rect.left
  light.ty = event.clientY - rect.top
  if (light.alpha === 0 && light.target === 0) {
    // Entering: the lamp starts under the cursor instead of sweeping in.
    light.x = light.tx
    light.y = light.ty
  }
  light.target = 1
  light.travelled = true
  kickLight()
}

function releasePointer(): void {
  light.target = 0
  kickLight()
}

function scheduleRebuild(): void {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    if (disposed || !host) return
    if (host.clientWidth === width && host.clientHeight === height) return
    build()
    startChurn()
  }, 140)
}

watch(reduced, () => {
  startChurn()
  build()
})

onMounted(() => {
  const canvas = canvasEl.value
  if (!canvas) return
  host = canvas.closest('section') ?? canvas.parentElement
  if (!host) return

  build()
  startChurn()

  // The mono font may still be loading on first paint; repaint once it is in.
  void document.fonts
    ?.load(`${FONT_PX}px ${FONT_FAMILY}`, GLYPHS)
    .then(() => {
      if (!disposed) {
        paintDigits()
        blit()
      }
    })
    .catch(() => {
      /* The fallback monospace is used instead. */
    })

  host.addEventListener('pointermove', updatePointer, { passive: true })
  host.addEventListener('pointerdown', updatePointer, { passive: true })
  host.addEventListener('pointerleave', releasePointer)
  host.addEventListener('pointercancel', releasePointer)

  resizeObserver = new ResizeObserver(scheduleRebuild)
  resizeObserver.observe(host)

  visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true
    if (!visible) {
      light.target = 0
      kickLight()
    }
  })
  visibilityObserver.observe(canvas)
})

onBeforeUnmount(() => {
  disposed = true
  if (frame !== 0) cancelAnimationFrame(frame)
  window.clearInterval(churnTimer)
  window.clearTimeout(resizeTimer)
  resizeObserver?.disconnect()
  visibilityObserver?.disconnect()
  host?.removeEventListener('pointermove', updatePointer)
  host?.removeEventListener('pointerdown', updatePointer)
  host?.removeEventListener('pointerleave', releasePointer)
  host?.removeEventListener('pointercancel', releasePointer)
})
</script>

<template>
  <div class="backdrop" aria-hidden="true">
    <canvas ref="canvasEl" class="backdrop__digits" />
    <div
      ref="lightEl"
      class="backdrop__light"
      :style="{ '--light-radius': `${LIGHT_RADIUS}px` }"
    />
    <div class="backdrop__scan" />
    <div class="backdrop__vignette" />
  </div>
</template>

<style scoped>
.backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  isolation: isolate;
}

.backdrop__digits {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}

/*
  The lamp: a soft radial light, screen-blended over the digits so the
  numbers underneath brighten where it passes. It is a separate layer and
  only ever moves by transform, which the compositor handles.
*/
.backdrop__light {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: calc(var(--light-radius) * 2);
  height: calc(var(--light-radius) * 2);
  margin: calc(var(--light-radius) * -1) 0 0 calc(var(--light-radius) * -1);
  border-radius: 50%;
  background: radial-gradient(
    circle closest-side,
    rgba(138, 162, 255, 0.26),
    rgba(138, 162, 255, 0.12) 42%,
    rgba(138, 162, 255, 0.04) 68%,
    transparent
  );
  mix-blend-mode: screen;
  opacity: 0;
  will-change: transform, opacity;
}

/* A slow scan line travelling down the field, like a CRT sweep. */
.backdrop__scan {
  position: absolute;
  inset: -20% 0 auto 0;
  z-index: 2;
  height: 18%;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(138, 162, 255, 0.05) 45%,
    rgba(138, 162, 255, 0.1) 50%,
    rgba(138, 162, 255, 0.05) 55%,
    transparent
  );
  animation: backdrop-scan 11s linear infinite;
}

@keyframes backdrop-scan {
  0% {
    transform: translateY(-30%);
  }
  100% {
    transform: translateY(760%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .backdrop__scan {
    display: none;
  }
}

.backdrop__vignette {
  position: absolute;
  inset: 0;
  z-index: 2;
  background:
    radial-gradient(120% 80% at 50% 0%, transparent 45%, rgba(9, 10, 12, 0.55) 100%),
    linear-gradient(to bottom, rgba(18, 20, 22, 0.9), transparent 14%, transparent 86%, rgba(18, 20, 22, 0.9));
}
</style>
