<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useReducedMotion } from '../composables/useReducedMotion'

/*
  A field of dots. The dots that fall inside the rendered text are larger and
  brighter, so the word is drawn in dot-matrix. On load the text dots slide
  in on straight horizontal lines from the left, released in a wave from
  left to right so the word assembles letter by letter, each dot flashing
  signal blue as it locks into place (about 2 seconds in total). The
  pointer dents the field: background dots
  give way freely, but text dots only yield a little against a stiffer
  spring and a hard displacement cap, so the word stays readable while you
  drag across it. Displaced dots swell slightly, keep a brief signal
  afterglow, and a click or tap sends a ripple ring through the field. The
  animation loop only runs while something is moving, and never while the
  canvas is off screen.
*/

const props = defineProps<{ text: string }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = useReducedMotion()

const SPRING = 0.085
const SPRING_TEXT = 0.16
const DAMPING = 0.84
const DAMPING_TEXT = 0.78
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
  /** Lingering signal glow (0..1) a dot keeps after being pushed. */
  glow: Float32Array
  /** Intro: ms after intro start when this dot is released (-1 = released). */
  delay: Float32Array
}

interface Ripple {
  x: number
  y: number
  r: number
  strength: number
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
/* x/y is the smoothed position the physics uses, tx/ty the raw target. */
const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, speed: 0, active: false }
const ripples: Ripple[] = []
/** performance.now() timestamp of the intro assembly (0 = no intro running). */
let introStart = 0

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

  // On narrow screens the whole word on one line comes out far too small:
  // at phone width each letter would be only a few dots wide and the stems
  // run into each other. Split it into two halves there ("hpmi" / "ne42"),
  // which allows roughly double the letter size.
  const twoLines = !landscape && width < 680 && props.text.length > 6
  const splitAt = Math.ceil(props.text.length / 2)
  const lines: readonly string[] = twoLines
    ? [props.text.slice(0, splitAt), props.text.slice(splitAt)]
    : [props.text]

  maskCtx.font = `${weight} 100px ${FONT_FAMILY}`
  // A little tracking keeps neighbouring stems apart in the dot sampling.
  try {
    maskCtx.letterSpacing = '3px'
  } catch {
    /* Older engines simply render without tracking. */
  }
  const measured = Math.max(...lines.map((line) => maskCtx.measureText(line).width))
  if (measured <= 0) return null

  const lineHeightFactor = 1.12
  const heightFit =
    lines.length === 1 ? height * 0.55 : (height * 0.52) / ((lines.length - 1) * lineHeightFactor + 0.72)
  const size = Math.min((100 * width * 0.92) / measured, heightFit)
  maskCtx.font = `${weight} ${size}px ${FONT_FAMILY}`
  try {
    maskCtx.letterSpacing = `${Math.round(size * 0.03)}px`
  } catch {
    /* See above. */
  }
  maskCtx.fillStyle = '#fff'

  if (lines.length === 1) {
    maskCtx.textBaseline = 'alphabetic'
    maskCtx.textAlign = 'left'
    const textWidth = (measured * size) / 100
    const x = landscape ? width * 0.045 : (width - textWidth) / 2
    const y = landscape ? height * 0.74 : height * 0.58
    maskCtx.fillText(lines[0] ?? props.text, x, y)
  } else {
    // Centred block, lines stacked with the middle of the block slightly
    // above the middle of the screen (the hero footer sits below it).
    maskCtx.textBaseline = 'middle'
    maskCtx.textAlign = 'center'
    const lineHeight = size * lineHeightFactor
    const centreY = height * 0.52
    lines.forEach((line, index) => {
      const y = centreY + (index - (lines.length - 1) / 2) * lineHeight
      maskCtx.fillText(line, width / 2, y)
    })
  }

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

  // Fine enough that a letter stem is covered by several dots (on a phone
  // this is 6px instead of 7px), coarse enough to stay cheap to draw.
  const spacing = Math.min(15, Math.max(6, Math.round(width / 110)))
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
    glow: new Float32Array(count),
    delay: new Float32Array(count).fill(-1),
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
        // Straight in, no curves: every dot starts on its own row, just off
        // the left edge of the screen, with no vertical offset at all. The
        // spring then pulls it along a perfectly straight horizontal line
        // onto its place — no swirl, no blob of waiting dots inside the
        // field. A slight variation in distance keeps the front from
        // looking like a rigid wall.
        next.dx[i] = -(x + width * 0.12 + Math.random() * spacing * 2)
        next.dy[i] = 0
        // Release in a wave across the word: left dots fly first, the last
        // letter starts after ~1s and needs about another second to settle.
        next.delay[i] = (x / width) * 1000 + Math.random() * 150
      }
    }
  }

  grid = next
  introStart = scatter ? performance.now() : 0
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
  // Deliberately well below half the spacing: if neighbouring text dots
  // nearly touch, stems merge into blobs and the letters become unreadable.
  const radiusText = g.spacing * (g.spacing < 10 ? 0.3 : 0.25)

  for (let i = 0; i < g.count; i += 1) {
    const displaced = Math.abs(g.dx[i] ?? 0) + Math.abs(g.dy[i] ?? 0) > 1.2
    // The afterglow keeps a dot signal-coloured a moment after it settles.
    g.kind[i] = displaced || (g.glow[i] ?? 0) > 0.18 ? KIND_SIGNAL : g.inText[i] === 1 ? KIND_TEXT : KIND_DIM
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
      // Pushed dots swell with their displacement and shrink back on return.
      const mag = Math.hypot(g.dx[i] ?? 0, g.dy[i] ?? 0)
      const swell = 1 + Math.min(mag / (g.spacing * 2.2), 1) * (g.inText[i] === 1 ? 0.35 : 1.1)
      const r =
        (g.inText[i] === 1 ? radiusText : kind === KIND_SIGNAL ? radiusDim * 1.8 : radiusDim) * swell
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

  // Glide the smoothed pointer toward the raw target and track its speed,
  // so a fast swipe sweeps a wider, harder push than a slow drift.
  if (pointer.active) {
    const prevX = pointer.x
    const prevY = pointer.y
    const glide = 1 - Math.pow(0.6, dt)
    pointer.x += (pointer.tx - pointer.x) * glide
    pointer.y += (pointer.ty - pointer.y) * glide
    const rawSpeed = Math.hypot(pointer.x - prevX, pointer.y - prevY) / dt
    pointer.speed += (rawSpeed - pointer.speed) * (1 - Math.pow(0.8, dt))
  } else {
    pointer.speed *= Math.pow(0.8, dt)
  }
  const speedBoost = Math.min(pointer.speed / 30, 1)

  // A deliberately small, gentle dent: even a fast swipe only widens the
  // field a little and never pushes much harder.
  const radius = Math.max(80, Math.min(120, width * 0.1)) * (1 + speedBoost * 0.35)
  const radiusSq = radius * radius
  const pushScale = 1 + speedBoost * 0.4
  const damping = Math.pow(DAMPING, dt)
  const dampingText = Math.pow(DAMPING_TEXT, dt)
  const glowDecay = Math.pow(0.94, dt)
  const maxDist = Math.hypot(width, height)
  const introElapsed = introStart > 0 ? now - introStart : Number.POSITIVE_INFINITY
  // The intro is over after ~3.5s at the latest, even if the pointer keeps
  // the field busy: from then on the readability caps apply.
  if (introElapsed > 3500) introStart = 0
  let moving = ripples.length > 0
  let displaced = false

  for (let i = 0; i < g.count; i += 1) {
    // Intro: hold each dot at its starting position until its wave moment,
    // then release it with a flash. Pointer and ripples cannot disturb a
    // dot that has not been released yet.
    const delay = g.delay[i] ?? -1
    if (delay >= 0) {
      if (introElapsed < delay) {
        moving = true
        continue
      }
      g.delay[i] = -1
      g.glow[i] = 1
    }

    const isText = g.inText[i] === 1
    // The word resists: text dots feel only about half the push.
    const give = isText ? 0.45 : 1
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
        const push = strength * strength * 3.1 * pushScale * give * dt
        vx += (ex / dist) * push
        vy += (ey / dist) * push
      }
    }

    // An expanding ripple ring shoves dots outward as it passes over them.
    for (const ripple of ripples) {
      const ex = (g.baseX[i] ?? 0) + dx - ripple.x
      const ey = (g.baseY[i] ?? 0) + dy - ripple.y
      const dist = Math.hypot(ex, ey)
      const off = Math.abs(dist - ripple.r)
      const band = 52
      if (dist > 0.01 && off < band) {
        const push = (1 - off / band) * ripple.strength * 2.6 * give * dt
        vx += (ex / dist) * push
        vy += (ey / dist) * push
      }
    }

    // Text dots sit on a stiffer, more damped spring: they dent and are
    // back in place quickly, without the wobbly overshoot of the field.
    const spring = isText ? SPRING_TEXT : SPRING
    const damp = isText ? dampingText : damping
    vx = (vx - dx * spring * dt) * damp
    vy = (vy - dy * spring * dt) * damp
    dx += vx * dt
    dy += vy * dt

    // Hard cap on travel, tight for text dots (about 2 dot spacings): the
    // letters can lean away from the pointer but never tear apart. Not
    // applied during the intro, where dots legitimately start far away.
    const cap = g.spacing * (isText ? 2.1 : 5)
    const travel = Math.hypot(dx, dy)
    if (introStart === 0 && travel > cap) {
      dx = (dx / travel) * cap
      dy = (dy / travel) * cap
      vx *= 0.6
      vy *= 0.6
    }

    g.dx[i] = dx
    g.dy[i] = dy
    g.vx[i] = vx
    g.vy[i] = vy

    // Charge the afterglow from displacement, then let it fade out.
    const mag = Math.hypot(dx, dy)
    const charged = Math.min(mag / (g.spacing * 2), 1)
    const faded = (g.glow[i] ?? 0) * glowDecay
    g.glow[i] = charged > 0.25 ? Math.max(faded, charged) : faded
    if ((g.glow[i] ?? 0) > 0.03) moving = true

    if (Math.abs(vx) + Math.abs(vy) > 0.02) moving = true
    if (Math.abs(dx) + Math.abs(dy) > 0.05) displaced = true
  }

  if (introStart > 0 && !moving) introStart = 0

  for (let i = ripples.length - 1; i >= 0; i -= 1) {
    const ripple = ripples[i]
    if (!ripple) continue
    ripple.r += 9.5 * dt
    ripple.strength *= Math.pow(0.985, dt)
    if (ripple.r > maxDist || ripple.strength < 0.05) ripples.splice(i, 1)
  }

  if (!moving && !displaced) {
    g.dx.fill(0)
    g.dy.fill(0)
    g.vx.fill(0)
    g.vy.fill(0)
    g.glow.fill(0)
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
  pointer.tx = event.clientX - rect.left
  pointer.ty = event.clientY - rect.top
  if (!pointer.active) {
    // Snap on entry so the field does not sweep in from the last visit.
    pointer.x = pointer.tx
    pointer.y = pointer.ty
    pointer.speed = 0
  }
  pointer.active = true
  kick()
}

function pressPointer(event: PointerEvent): void {
  updatePointer(event)
  if (reduced.value || !visible) return
  // A click or tap rings the field like a struck surface.
  ripples.push({ x: pointer.tx, y: pointer.ty, r: 0, strength: 1 })
  if (ripples.length > 3) ripples.shift()
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
  ripples.length = 0
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
  host.addEventListener('pointerdown', pressPointer)
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
  host?.removeEventListener('pointerdown', pressPointer)
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
