<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useReducedMotion } from '../composables/useReducedMotion'

/*
  A field of dots. The dots that fall inside the rendered text are larger and
  brighter, so the word is drawn in dot-matrix. The pointer pushes dots away
  and springs bring them back. The animation loop only runs while something is
  moving, and never while the canvas is off screen.
*/

const props = defineProps<{ text: string }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = useReducedMotion()

const SPRING = 0.085
const DAMPING = 0.82
const TAU = Math.PI * 2
const FONT_FAMILY = '"Geist Variable", system-ui, sans-serif'

const KIND_DIM = 0
const KIND_TEXT = 1
const KIND_SIGNAL = 2

interface Grid {
  count: number
  spacing: number
  baseX: Float32Array
  baseY: Float32Array
  inText: Uint8Array
  kind: Uint8Array
  dx: Float32Array
  dy: Float32Array
  vx: Float32Array
  vy: Float32Array
}

let grid: Grid | null = null
let ctx: CanvasRenderingContext2D | null = null
let host: HTMLElement | null = null
let width = 0
let height = 0
let ratio = 1
let frame = 0
let lastTime = 0
let visible = true
let disposed = false
let resizeTimer = 0
let resizeObserver: ResizeObserver | null = null
let visibilityObserver: IntersectionObserver | null = null
let colorDim = '#2b3036'
let colorText = '#e9e7e2'
let colorSignal = '#8aa2ff'
const pointer = { x: -9999, y: -9999, active: false }

function readColors(canvas: HTMLCanvasElement): void {
  const style = getComputedStyle(canvas)
  colorDim = style.getPropertyValue('--dot-dim').trim() || colorDim
  colorText = style.getPropertyValue('--paper').trim() || colorText
  colorSignal = style.getPropertyValue('--signal').trim() || colorSignal
}

/** Renders the word off screen and returns its alpha channel (CSS pixel resolution). */
function sampleText(): Uint8ClampedArray | null {
  const mask = document.createElement('canvas')
  mask.width = width
  mask.height = height
  const maskCtx = mask.getContext('2d', { willReadFrequently: true })
  if (!maskCtx) return null

  const landscape = width > height
  // Narrow screens get a heavier weight so the letters keep enough dots per stem.
  const weight = landscape ? 700 : 850
  maskCtx.font = `${weight} 100px ${FONT_FAMILY}`
  const measured = maskCtx.measureText(props.text).width
  if (measured <= 0) return null

  const size = Math.min((100 * width * 0.9) / measured, height * 0.55)
  maskCtx.font = `${weight} ${size}px ${FONT_FAMILY}`
  maskCtx.textBaseline = 'alphabetic'
  maskCtx.textAlign = 'left'
  maskCtx.fillStyle = '#fff'
  const textWidth = (measured * size) / 100
  const x = landscape ? width * 0.045 : (width - textWidth) / 2
  const y = landscape ? height * 0.74 : height * 0.58
  maskCtx.fillText(props.text, x, y)

  return maskCtx.getImageData(0, 0, width, height).data
}

function build(scatter: boolean): void {
  const canvas = canvasEl.value
  if (!canvas || !host) return

  const nextWidth = host.clientWidth
  const nextHeight = host.clientHeight
  if (nextWidth === 0 || nextHeight === 0) return
  width = nextWidth
  height = nextHeight
  ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  ctx = canvas.getContext('2d')
  if (!ctx) return
  readColors(canvas)

  const spacing = Math.min(16, Math.max(7, Math.round(width / 96)))
  const cols = Math.floor(width / spacing) + 1
  const rows = Math.floor(height / spacing) + 1
  const count = cols * rows
  const originX = (width - (cols - 1) * spacing) / 2
  const originY = (height - (rows - 1) * spacing) / 2
  const alpha = sampleText()

  const next: Grid = {
    count,
    spacing,
    baseX: new Float32Array(count),
    baseY: new Float32Array(count),
    inText: new Uint8Array(count),
    kind: new Uint8Array(count),
    dx: new Float32Array(count),
    dy: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const i = row * cols + col
      const x = originX + col * spacing
      const y = originY + row * spacing
      next.baseX[i] = x
      next.baseY[i] = y
      if (alpha) {
        const px = Math.min(width - 1, Math.max(0, Math.round(x)))
        const py = Math.min(height - 1, Math.max(0, Math.round(y)))
        const value = alpha[(py * width + px) * 4 + 3] ?? 0
        if (value > 128) next.inText[i] = 1
      }
      if (scatter && next.inText[i] === 1) {
        const angle = Math.random() * TAU
        const distance = spacing * (6 + Math.random() * 22)
        next.dx[i] = Math.cos(angle) * distance
        next.dy[i] = Math.sin(angle) * distance
      }
    }
  }

  grid = next
  draw()
  if (scatter) kick()
}

function draw(): void {
  const g = grid
  const c = ctx
  if (!g || !c) return

  c.setTransform(ratio, 0, 0, ratio, 0, 0)
  c.clearRect(0, 0, width, height)

  const radiusDim = g.spacing * 0.085
  const radiusText = g.spacing * (g.spacing < 10 ? 0.34 : 0.26)

  for (let i = 0; i < g.count; i += 1) {
    const displaced = Math.abs(g.dx[i] ?? 0) + Math.abs(g.dy[i] ?? 0) > 1.2
    g.kind[i] = displaced ? KIND_SIGNAL : g.inText[i] === 1 ? KIND_TEXT : KIND_DIM
  }

  const passes: ReadonlyArray<readonly [number, string]> = [
    [KIND_DIM, colorDim],
    [KIND_TEXT, colorText],
    [KIND_SIGNAL, colorSignal],
  ]

  for (const [kind, color] of passes) {
    c.fillStyle = color
    c.beginPath()
    for (let i = 0; i < g.count; i += 1) {
      if (g.kind[i] !== kind) continue
      const x = (g.baseX[i] ?? 0) + (g.dx[i] ?? 0)
      const y = (g.baseY[i] ?? 0) + (g.dy[i] ?? 0)
      const r = g.inText[i] === 1 ? radiusText : kind === KIND_SIGNAL ? radiusDim * 1.8 : radiusDim
      c.moveTo(x + r, y)
      c.arc(x, y, r, 0, TAU)
    }
    c.fill()
  }
}

function step(now: number): void {
  frame = 0
  const g = grid
  if (!g || disposed || !visible) return

  const dt = Math.min(2, (now - lastTime) / 16.667 || 1)
  lastTime = now
  const radius = Math.max(90, Math.min(160, width * 0.12))
  const radiusSq = radius * radius
  const damping = Math.pow(DAMPING, dt)
  let moving = false
  let displaced = false

  for (let i = 0; i < g.count; i += 1) {
    let dx = g.dx[i] ?? 0
    let dy = g.dy[i] ?? 0
    let vx = g.vx[i] ?? 0
    let vy = g.vy[i] ?? 0

    if (pointer.active) {
      const ex = (g.baseX[i] ?? 0) + dx - pointer.x
      const ey = (g.baseY[i] ?? 0) + dy - pointer.y
      const distSq = ex * ex + ey * ey
      if (distSq < radiusSq && distSq > 0.01) {
        const dist = Math.sqrt(distSq)
        const strength = 1 - dist / radius
        const push = strength * strength * 5 * dt
        vx += (ex / dist) * push
        vy += (ey / dist) * push
      }
    }

    vx = (vx - dx * SPRING * dt) * damping
    vy = (vy - dy * SPRING * dt) * damping
    dx += vx * dt
    dy += vy * dt

    g.dx[i] = dx
    g.dy[i] = dy
    g.vx[i] = vx
    g.vy[i] = vy

    if (Math.abs(vx) + Math.abs(vy) > 0.02) moving = true
    if (Math.abs(dx) + Math.abs(dy) > 0.05) displaced = true
  }

  if (!moving && !displaced) {
    g.dx.fill(0)
    g.dy.fill(0)
    g.vx.fill(0)
    g.vy.fill(0)
  }

  draw()
  if (moving) frame = requestAnimationFrame(step)
}

function kick(): void {
  if (frame !== 0 || reduced.value || !visible || !grid) return
  lastTime = performance.now()
  frame = requestAnimationFrame(step)
}

function updatePointer(event: PointerEvent): void {
  const canvas = canvasEl.value
  if (!canvas || reduced.value || !visible) return
  const rect = canvas.getBoundingClientRect()
  pointer.x = event.clientX - rect.left
  pointer.y = event.clientY - rect.top
  pointer.active = true
  kick()
}

function releasePointer(): void {
  pointer.active = false
  kick()
}

function scheduleRebuild(): void {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    if (!host || disposed) return
    if (host.clientWidth === width && host.clientHeight === height) return
    build(false)
  }, 120)
}

watch(reduced, () => {
  if (!grid) return
  pointer.active = false
  build(false)
})

onMounted(async () => {
  const canvas = canvasEl.value
  if (!canvas) return
  host = canvas.parentElement
  if (!host) return

  try {
    await document.fonts.load(`700 100px ${FONT_FAMILY}`, props.text)
    await document.fonts.load(`850 100px ${FONT_FAMILY}`, props.text)
  } catch {
    /* The system fallback font is used instead. */
  }
  if (disposed) return

  build(!reduced.value)

  host.addEventListener('pointermove', updatePointer)
  host.addEventListener('pointerdown', updatePointer)
  host.addEventListener('pointerleave', releasePointer)
  host.addEventListener('pointercancel', releasePointer)

  resizeObserver = new ResizeObserver(scheduleRebuild)
  resizeObserver.observe(host)

  visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true
    if (visible) draw()
    else if (frame !== 0) {
      cancelAnimationFrame(frame)
      frame = 0
    }
  })
  visibilityObserver.observe(canvas)
})

onBeforeUnmount(() => {
  disposed = true
  if (frame !== 0) cancelAnimationFrame(frame)
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
  <canvas ref="canvasEl" class="dot-field" aria-hidden="true" />
</template>

<style scoped>
.dot-field {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
</style>
