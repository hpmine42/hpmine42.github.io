<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useReducedMotion } from '../composables/useReducedMotion'

/*
  A field of dots. The dots that fall inside the rendered text are larger and
  brighter, so the word is drawn in dot-matrix. On load the text dots slide
  in on straight horizontal lines from the left, released in a wave from
  left to right so the word assembles letter by letter, each dot flashing
  signal blue as it locks into place (about 2 seconds in total). The
  pointer carries a small worm: a short chain of evenly spaced segments
  that follows the pointer's path like a little animal — straight when
  you move straight, bending when you turn. The trail is made by the dot
  field itself: every dot the body passes over turns signal blue and
  swells until it nearly touches its neighbours, and the dots are barely
  pushed aside — so the middle of the trail is filled with lit dots
  instead of being a hollow tube. Only the head is a single small solid
  dot. The body is evened out over the last few path points, so it reads
  as one clean curve instead of a jittery stroke. When the pointer stops,
  the tail does not freeze: it retracts into the head and the head fades,
  until nothing is left — moving again grows a fresh tail from the new
  spot. A tap or click leaves one clearly larger dot that blooms where
  the pointer went down, then grows and fades again. Dots near the worm
  light up signal blue; the letters of the name lean away noticeably more
  than the rest of the field, but against a stiffer spring and a hard
  displacement cap, so the word stays readable.
  The animation loop only runs while something is moving, and never while
  the canvas is off screen.
*/

const props = defineProps<{ text: string }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const reduced = useReducedMotion()

const SPRING = 0.085
// The name is on a looser spring than before: it sways and wobbles with the
// tail instead of only denting for a moment.
const SPRING_TEXT = 0.115
const DAMPING = 0.84
const DAMPING_TEXT = 0.82
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
/** 1 while the pointer moves, falling to 0 while it rests (tail retracts). */
let wormLife = 0
/* x/y is the lagging circle position the physics uses, tx/ty the raw
   pointer target it eases toward. */
const pointer = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false }
/** Pointer path, newest first. The worm's segments sit at fixed distances
    along this path, so the body keeps an even spacing whatever happens. */
const wormPath: Array<{ x: number; y: number }> = []
const WORM_SEGMENTS = 18
const WORM_SPACING = 8
/** A resting pointer keeps its tail this long, then the tail retracts. */
const WORM_HOLD_MS = 120
const WORM_RETRACT_MS = 520
/** Body geometry of the last step, shared with draw() so it can be painted. */
const wormX = new Float32Array(WORM_SEGMENTS)
const wormY = new Float32Array(WORM_SEGMENTS)
let wormCount = 0
/** A dot that blooms where the pointer was pressed, then grows and fades. */
const press = { x: 0, y: 0, at: Number.NEGATIVE_INFINITY, strength: 0 }
const PRESS_MS = 620
/** performance.now() of the last real pointer movement, for the retraction. */
let lastMoveAt = 0
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
  press.at = Number.NEGATIVE_INFINITY
  press.strength = 0
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
      // Pushed dots swell with their displacement and shrink back on
      // return; glowing dots (the worm's body) swell with their glow, so
      // the worm reads as a plump little chain even where nothing moved.
      const mag = Math.hypot(g.dx[i] ?? 0, g.dy[i] ?? 0)
      const swell =
        1 +
        Math.min(mag / (g.spacing * 2.2), 1) * (g.inText[i] === 1 ? 0.95 : 1.1) +
        (kind === KIND_SIGNAL ? (g.glow[i] ?? 0) * (g.inText[i] === 1 ? 0.85 : 1.35) : 0)
      const r =
        (g.inText[i] === 1 ? radiusText : kind === KIND_SIGNAL ? radiusDim * 2.6 : radiusDim) * swell
      c.moveTo(x + r, y)
      c.arc(x, y, r, 0, TAU)
    }
    c.fill()
  }

  // The head: one small solid dot on the pointer. Everything else about
  // the trail is made of the field's own dots, which turn signal blue and
  // swell where the body passes — including the dots right inside it, so
  // the trail is filled instead of hollow.
  if (pointer.active && !reduced.value && wormLife > 0.02) {
    const headR = g.spacing * 0.44 * (0.7 + 0.3 * wormLife)
    c.fillStyle = colorSignal
    c.globalAlpha = 0.9 * wormLife
    c.beginPath()
    c.arc(pointer.x, pointer.y, headR, 0, TAU)
    c.fill()
    c.globalAlpha = 1
  }

  // The press dot: clearly larger than a normal dot. It sits at full
  // strength under the finger/cursor at the moment of the tap, then
  // expands and fades out instead of just vanishing.
  if (press.strength > 0.002) {
    const grow = 1 - press.strength
    c.globalAlpha = Math.min(1, press.strength * 1.15) * 0.92
    c.fillStyle = colorSignal
    c.beginPath()
    c.arc(press.x, press.y, radiusDim * (3.2 + 6.4 * grow), 0, TAU)
    c.fill()
    c.globalAlpha = 1
  }
}

function step(now: number): void {
  frame = 0
  const g = grid
  if (!g || disposed || !visible) return

  const dt = Math.min(2, (now - lastTime) / 16.667 || 1)
  lastTime = now

  const pressAge = now - press.at
  press.strength = pressAge >= 0 && pressAge < PRESS_MS ? 1 - pressAge / PRESS_MS : 0

  // How much worm is left: full while the pointer moves, then it retracts
  // over a moment until the field has nothing on it again.
  const idleFor = now - lastMoveAt
  wormLife = !pointer.active
    ? 0
    : idleFor <= WORM_HOLD_MS
      ? 1
      : Math.max(0, 1 - (idleFor - WORM_HOLD_MS) / WORM_RETRACT_MS)

  // Follow the pointer closely, with just a little lag.
  if (pointer.active) {
    const glide = 1 - Math.pow(0.35, dt)
    pointer.x += (pointer.tx - pointer.x) * glide
    pointer.y += (pointer.ty - pointer.y) * glide

    const newest = wormPath[0]
    if (!newest || Math.hypot(pointer.x - newest.x, pointer.y - newest.y) > 4) {
      wormPath.unshift({ x: pointer.x, y: pointer.y })
      if (wormPath.length > 150) wormPath.pop()
    }
  } else {
    wormPath.length = 0
  }

  // Lay the worm's segments along the path at fixed arc-length distances:
  // segment 0 is the head on the pointer, each next one WORM_SPACING px
  // further back along the route the head actually travelled. Evenly
  // spaced by construction — the body cannot bunch up or overlap itself.
  wormCount = 0
  // Only the part of the body that is still alive gets laid down; the rest
  // of the path simply stays unused, so the tail shortens from the tip.
  const reach = WORM_SPACING * (WORM_SEGMENTS - 1) * wormLife
  if (pointer.active && wormLife > 0 && wormPath.length > 0) {
    let seg = 1 // current path segment (wormPath[seg-1] -> wormPath[seg])
    let walked = 0 // path length covered before that segment
    for (let s = 0; s < WORM_SEGMENTS; s += 1) {
      const target = s * WORM_SPACING
      if (target > reach) break
      while (seg < wormPath.length) {
        const a = wormPath[seg - 1]
        const b = wormPath[seg]
        if (!a || !b) break
        const segLen = Math.hypot(b.x - a.x, b.y - a.y)
        if (walked + segLen >= target) break
        walked += segLen
        seg += 1
      }
      const a = wormPath[Math.min(seg - 1, wormPath.length - 1)]
      const b = wormPath[Math.min(seg, wormPath.length - 1)]
      if (!a || !b) break
      const segLen = Math.hypot(b.x - a.x, b.y - a.y)
      const t = segLen > 0 ? Math.min(1, Math.max(0, (target - walked) / segLen)) : 0
      wormX[s] = a.x + (b.x - a.x) * t
      wormY[s] = a.y + (b.y - a.y) * t
      wormCount = s + 1
    }
  }

  // Order: one light smoothing pass along the body. It evens out the small
  // wobbles of raw pointer samples, so the worm reads as a tidy curve
  // instead of a scribble, while the head stays exactly on the pointer.
  for (let s = 1; s < wormCount - 1; s += 1) {
    const px = wormX[s - 1] ?? 0
    const py = wormY[s - 1] ?? 0
    const nx = wormX[s + 1] ?? 0
    const ny = wormY[s + 1] ?? 0
    wormX[s] = (px + 2 * (wormX[s] ?? 0) + nx) / 4
    wormY[s] = (py + 2 * (wormY[s] ?? 0) + ny) / 4
  }

  const damping = Math.pow(DAMPING, dt)
  const dampingText = Math.pow(DAMPING_TEXT, dt)
  const glowDecay = Math.pow(0.9, dt)
  const introElapsed = introStart > 0 ? now - introStart : Number.POSITIVE_INFINITY
  // The intro is over after ~3.5s at the latest, even if the pointer keeps
  // the field busy: from then on the readability caps apply.
  if (introElapsed > 3500) introStart = 0
  let moving = false
  let displaced = false

  for (let i = 0; i < g.count; i += 1) {
    // Intro: hold each dot at its starting position until its wave moment,
    // then release it with a flash. The pointer cannot disturb a
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
    let dx = g.dx[i] ?? 0
    let dy = g.dy[i] ?? 0
    let vx = g.vx[i] ?? 0
    let vy = g.vy[i] ?? 0

    // The worm: find this dot's strongest segment. Segments shrink a
    // little toward the tail. Only the best segment acts — never a sum —
    // and the push is small: the worm is mostly light, not a bulldozer.
    let wormGlow = 0
    if (pointer.active) {
      let best = 0
      let bestX = 0
      let bestY = 0
      const dotX = (g.baseX[i] ?? 0) + dx
      const dotY = (g.baseY[i] ?? 0) + dy
      for (let s = 0; s < wormCount; s += 1) {
        const fade = 1 - s / WORM_SEGMENTS
        // The letters feel the tail from a little further away, so the whole
        // word starts to move before the tail actually reaches it.
        const segRadius = (14 + 20 * fade) * (isText ? 1.18 : 1)
        const ex = dotX - (wormX[s] ?? 0)
        const ey = dotY - (wormY[s] ?? 0)
        const dist = Math.hypot(ex, ey)
        if (dist >= segRadius || dist <= 0.01) continue
        const candidate = (1 - dist / segRadius) * (0.35 + 0.65 * fade)
        if (candidate > best) {
          best = candidate
          bestX = ex / dist
          bestY = ey / dist
        }
      }
      wormGlow = best
      if (best > 0) {
        // The field's own dots mostly just light up — that is what keeps the
        // trail solid — but the letters of the name are shoved hard, so the
        // word visibly bends away from the tail and swings back after it.
        const push = best * best * (isText ? 1.5 : 0.35) * dt
        vx += bestX * push
        vy += bestY * push
      }
    }

    // The press dot also nudges the dots around it outward, so a tap
    // reads as a small bloom rather than a single floating circle.
    if (press.strength > 0) {
      const dotX = (g.baseX[i] ?? 0) + dx
      const dotY = (g.baseY[i] ?? 0) + dy
      const ex = dotX - press.x
      const ey = dotY - press.y
      const dist = Math.hypot(ex, ey)
      const flareRadius = g.spacing * 3.4
      if (dist < flareRadius && dist > 0.01) {
        const f = (1 - dist / flareRadius) * press.strength
        const push = f * f * 2.4 * dt
        vx += (ex / dist) * push
        vy += (ey / dist) * push
        if (f > 0.08) g.glow[i] = Math.max(g.glow[i] ?? 0, f)
      }
    }

    // Text dots are a little stiffer than the free field, so they come back
    // to their place on their own, but loose enough to swing and wobble.
    const spring = isText ? SPRING_TEXT : SPRING
    const damp = isText ? dampingText : damping
    vx = (vx - dx * spring * dt) * damp
    vy = (vy - dy * spring * dt) * damp
    dx += vx * dt
    dy += vy * dt

    // Hard cap on travel (about 3.8 dot spacings for the letters, 3.6 for
    // the field): the word bends far away from the tail but never tears
    // apart. Not applied during the intro, where dots legitimately start
    // far away.
    const cap = g.spacing * (isText ? 3.8 : 3.6)
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
    // The worm's body is light: dots under a segment glow while it passes.
    if (wormGlow > 0.08) g.glow[i] = Math.max(g.glow[i] ?? 0, wormGlow)
    if ((g.glow[i] ?? 0) > 0.03) moving = true

    if (Math.abs(vx) + Math.abs(vy) > 0.02) moving = true
    if (Math.abs(dx) + Math.abs(dy) > 0.05) displaced = true
  }

  if (introStart > 0 && !moving) introStart = 0
  if (press.strength > 0) moving = true
  // Keep stepping while the tail is still pulling itself in.
  if (pointer.active && wormLife > 0) moving = true

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
  const nextX = event.clientX - rect.left
  const nextY = event.clientY - rect.top
  if (Math.hypot(nextX - pointer.tx, nextY - pointer.ty) > 0.5 || !pointer.active) {
    lastMoveAt = performance.now()
    wormLife = 1
  }
  pointer.tx = nextX
  pointer.ty = nextY
  if (!pointer.active) {
    // Snap on entry so the field does not sweep in from the last visit,
    // and start a fresh tail at the entry point.
    pointer.x = pointer.tx
    pointer.y = pointer.ty
    wormPath.length = 0
  }
  pointer.active = true
  kick()
}

function pressPointer(event: PointerEvent): void {
  updatePointer(event)
  if (!pointer.active) return
  // The head sits exactly on the click point, so the bloom starts there.
  press.x = pointer.x
  press.y = pointer.y
  press.at = performance.now()
  press.strength = 1
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
  wormPath.length = 0
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
