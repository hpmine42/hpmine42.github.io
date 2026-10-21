<script setup lang="ts">
/*
  A quiet grid of points. Under a moving lens the points turn into shifting
  characters, like data briefly made legible. The lens follows the pointer,
  and drifts on its own when nobody is touching it. Pauses when off-screen
  or in a hidden tab; static with prefers-reduced-motion.
*/
import { onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue'
import { usePrefersReducedMotion } from '../composables/usePrefersReducedMotion'
import { GLYPHS, hash3 } from '../utils/glyphs'

interface Point {
  x: number
  y: number
}

const CELL = 22
const FONT_SIZE = 14
const POINTER_HOLD_MS = 2400

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const reduced = usePrefersReducedMotion()

let ctx: CanvasRenderingContext2D | null = null
let dotLayer: HTMLCanvasElement | null = null
let width = 0
let height = 0
let cols = 0
let rows = 0
let originX = 0
let originY = 0
let frame = 0
let visible = false
let fontFamily = 'monospace'
let resizeObserver: ResizeObserver | null = null
let intersectionObserver: IntersectionObserver | null = null

const palette = {
  dot: 'rgb(236 233 225 / 0.14)',
  glyph: '#ece9e1',
  accent: '#ff5a2c',
}
const lens: Point = { x: 0, y: 0 }
const pointer = { x: 0, y: 0, active: false, at: 0 }

function readStyles(element: HTMLElement): void {
  const styles = getComputedStyle(element)
  palette.dot = styles.getPropertyValue('--field-dot').trim() || palette.dot
  palette.glyph = styles.getPropertyValue('--field-glyph').trim() || palette.glyph
  palette.accent = styles.getPropertyValue('--field-accent').trim() || palette.accent
  fontFamily = styles.getPropertyValue('--font-mono').trim() || fontFamily
}

function idlePoint(time: number): Point {
  const k = time / 1000
  return {
    x: width * (0.64 + 0.2 * Math.sin(k * 0.21)),
    y: height * (0.4 + 0.22 * Math.sin(k * 0.29 + 1.2)),
  }
}

function layout(): void {
  const canvas = canvasRef.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = rect.width
  height = rect.height
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  readStyles(canvas)

  cols = Math.floor(width / CELL) + 1
  rows = Math.floor(height / CELL) + 1
  originX = (width - (cols - 1) * CELL) / 2
  originY = (height - (rows - 1) * CELL) / 2

  dotLayer = document.createElement('canvas')
  dotLayer.width = canvas.width
  dotLayer.height = canvas.height
  const dots = dotLayer.getContext('2d')
  if (dots) {
    dots.setTransform(dpr, 0, 0, dpr, 0, 0)
    dots.fillStyle = palette.dot
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        dots.fillRect(originX + i * CELL - 0.75, originY + j * CELL - 0.75, 1.5, 1.5)
      }
    }
  }

  const time = reduced.value ? 0 : performance.now()
  if (!pointer.active) {
    const start = idlePoint(time)
    lens.x = start.x
    lens.y = start.y
  }
  render(time)
}

function render(time: number): void {
  if (!ctx || !dotLayer) return
  ctx.clearRect(0, 0, width, height)
  ctx.drawImage(dotLayer, 0, 0, width, height)

  const radius = Math.max(110, Math.min(220, width * 0.17))
  const i0 = Math.max(0, Math.floor((lens.x - radius - originX) / CELL))
  const i1 = Math.min(cols - 1, Math.ceil((lens.x + radius - originX) / CELL))
  const j0 = Math.max(0, Math.floor((lens.y - radius - originY) / CELL))
  const j1 = Math.min(rows - 1, Math.ceil((lens.y + radius - originY) / CELL))

  ctx.font = `500 ${FONT_SIZE}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      const x = originX + i * CELL
      const y = originY + j * CELL
      const distance = Math.hypot(x - lens.x, y - lens.y)
      if (distance >= radius) continue
      const strength = 1 - distance / radius
      const seed = hash3(i, j, 7)
      const isAccent = seed < 0.035
      const alpha = strength * strength * (isAccent ? 0.95 : 0.6)
      if (alpha < 0.03) continue
      const period = 240 + seed * 560
      const step = Math.floor((time + seed * 1000) / period)
      const glyph = GLYPHS[Math.floor(hash3(i, j, step) * GLYPHS.length)] ?? '0'
      ctx.globalAlpha = alpha
      ctx.fillStyle = isAccent ? palette.accent : palette.glyph
      ctx.fillText(glyph, x, y)
    }
  }
  ctx.globalAlpha = 1
}

function tick(time: number): void {
  frame = 0
  if (!visible || document.hidden || reduced.value) return
  const following = pointer.active && time - pointer.at < POINTER_HOLD_MS
  if (!following) pointer.active = false
  const goal: Point = following ? pointer : idlePoint(time)
  lens.x += (goal.x - lens.x) * 0.07
  lens.y += (goal.y - lens.y) * 0.07
  render(time)
  frame = requestAnimationFrame(tick)
}

function start(): void {
  if (reduced.value) {
    const still = idlePoint(0)
    lens.x = still.x
    lens.y = still.y
    render(0)
    return
  }
  if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick)
}

function stop(): void {
  if (frame) cancelAnimationFrame(frame)
  frame = 0
}

function onPointer(event: PointerEvent): void {
  const canvas = canvasRef.value
  if (!canvas || !visible || reduced.value) return
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) return
  pointer.x = x
  pointer.y = y
  pointer.active = true
  pointer.at = performance.now()
}

function onVisibilityChange(): void {
  if (document.hidden) stop()
  else start()
}

watch(reduced, () => {
  stop()
  pointer.active = false
  start()
})

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  layout()

  resizeObserver = new ResizeObserver(() => layout())
  resizeObserver.observe(canvas)

  intersectionObserver = new IntersectionObserver((entries) => {
    const entry = entries[entries.length - 1]
    visible = entry ? entry.isIntersecting : false
    if (visible) start()
    else stop()
  })
  intersectionObserver.observe(canvas)

  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerdown', onPointer, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)

  // Re-draw once the mono face is ready so the glyphs use it.
  void document.fonts.ready.then(() => {
    if (!frame) render(reduced.value ? 0 : performance.now())
  })
})

onBeforeUnmount(() => {
  stop()
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  window.removeEventListener('pointermove', onPointer)
  window.removeEventListener('pointerdown', onPointer)
  document.removeEventListener('visibilitychange', onVisibilityChange)
})
</script>

<template>
  <canvas ref="canvas" class="field" aria-hidden="true"></canvas>
</template>

<style scoped>
.field {
  width: 100%;
  height: 100%;
  pointer-events: none;
}
</style>
