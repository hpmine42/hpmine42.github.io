<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { elsewhere, enough } from '../data/content'
import { useReducedMotion } from '../composables/useReducedMotion'
import { useScrollProgressVar } from '../composables/useScrollProgressVar'
import EnoughBackdrop from './EnoughBackdrop.vue'
import EnoughThread from './EnoughThread.vue'
import ExternalLink from './ExternalLink.vue'
import FactList from './FactList.vue'
import GitHubMark from './GitHubMark.vue'

const reduced = useReducedMotion()
const word = ref<HTMLElement | null>(null)
const root = ref<HTMLElement | null>(null)
const panel = ref<HTMLElement | null>(null)
const revealed = ref(false)

// The title gets lighter as it scrolls into place: less, but enough.
useScrollProgressVar(
  word,
  '--p',
  computed(() => !reduced.value),
)

let observer: IntersectionObserver | null = null

onMounted(() => {
  // Everything inside fades and rises into place once, when the section
  // first comes into view.
  const element = root.value
  if (element) {
    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        revealed.value = true
        observer?.disconnect()
        observer = null
      },
      { threshold: 0.12 },
    )
    observer.observe(element)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

/* The demo window leans a little toward the pointer and carries a moving
   glare, which makes it read as a pane of glass rather than a flat box. */
function tiltPanel(event: PointerEvent): void {
  const element = panel.value
  if (!element || reduced.value) return
  const rect = element.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return
  const px = (event.clientX - rect.left) / rect.width
  const py = (event.clientY - rect.top) / rect.height
  element.style.setProperty('--ry', `${((px - 0.5) * 7).toFixed(2)}deg`)
  element.style.setProperty('--rx', `${((0.5 - py) * 5).toFixed(2)}deg`)
  element.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
  element.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
}

function resetPanel(): void {
  const element = panel.value
  if (!element) return
  element.style.setProperty('--rx', '0deg')
  element.style.setProperty('--ry', '0deg')
  element.style.setProperty('--mx', '50%')
  element.style.setProperty('--my', '0%')
}
</script>

<template>
  <section
    id="enough"
    ref="root"
    class="enough"
    :data-revealed="revealed ? 'true' : 'false'"
    aria-labelledby="enough-title"
  >
    <EnoughBackdrop />

    <div class="enough__inner">
      <!-- One selected project, clearly labelled as such. -->
      <div class="enough__meta" data-reveal style="--reveal-delay: 0">
        <p class="enough__kicker">
          <span class="enough__pulse" aria-hidden="true" />
          {{ enough.kicker }}
        </p>
        <p class="enough__count" aria-hidden="true">01 / 01</p>
      </div>

      <h2 id="enough-title" ref="word" class="enough__word" data-reveal style="--reveal-delay: 80">
        {{ enough.name }}
      </h2>
      <div class="enough__rule" aria-hidden="true" />

      <div class="enough__grid">
        <div class="enough__intro">
          <p class="enough__lede" data-reveal style="--reveal-delay: 160">{{ enough.summary }}</p>

          <ol class="enough__highlights">
            <li
              v-for="(item, index) in enough.highlights"
              :key="item.title"
              class="enough__highlight"
              data-reveal
              :style="{ '--reveal-delay': 220 + index * 90 }"
            >
              <span class="enough__hindex" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <h3 class="enough__htitle">{{ item.title }}</h3>
                <p class="enough__htext">{{ item.text }}</p>
              </div>
            </li>
          </ol>

          <div class="enough__actions" data-reveal style="--reveal-delay: 500">
            <ExternalLink :href="enough.liveUrl" variant="button">Open enough.</ExternalLink>
            <ExternalLink :href="enough.repoUrl">Source on GitHub</ExternalLink>
          </div>
        </div>

        <div class="enough__visual">
          <!-- The demo, framed like a small app window with glass and glare. -->
          <div
            ref="panel"
            class="enough__panel"
            data-reveal
            style="--reveal-delay: 260"
            @pointermove="tiltPanel"
            @pointerleave="resetPanel"
            @pointercancel="resetPanel"
          >
            <div class="enough__chrome" aria-hidden="true">
              <span class="enough__chrome-dots"><i /><i /><i /></span>
              <span class="enough__chrome-title">enough. — end-to-end</span>
              <span class="enough__chrome-meta">
                <span class="enough__chrome-signal" />
                1:1 · signal
              </span>
            </div>
            <div class="enough__panel-body">
              <EnoughThread />
            </div>
            <span class="enough__glare" aria-hidden="true" />
          </div>

          <FactList :facts="enough.facts" />
        </div>
      </div>

      <!-- The rest of the work: one clear door to GitHub. -->
      <aside class="enough__elsewhere" data-reveal style="--reveal-delay: 340" aria-labelledby="elsewhere-title">
        <div class="enough__elsewhere-copy">
          <p class="enough__eyebrow">{{ elsewhere.eyebrow }}</p>
          <h3 id="elsewhere-title" class="enough__elsewhere-title">{{ elsewhere.title }}</h3>
          <p class="enough__elsewhere-text">{{ elsewhere.text }}</p>
        </div>

        <ExternalLink class="enough__elsewhere-link" :href="elsewhere.url" variant="button">
          <GitHubMark class="enough__elsewhere-mark" />
          <span>{{ elsewhere.label }}</span>
          <svg class="enough__arrow" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <path
              d="M3 10h13M11 4.5 16.5 10 11 15.5"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </ExternalLink>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.enough {
  --bg: var(--graphite);
  --fg: var(--paper);
  --fg-muted: var(--paper-muted);
  --rule: var(--graphite-line);
  --rule-strong: var(--graphite-line-strong);
  --focus: var(--signal);
  --accent: var(--signal);

  position: relative;
  isolation: isolate;
  overflow-x: clip;
  padding: var(--section-y) var(--gutter);
  background:
    radial-gradient(90% 60% at 50% 0%, #171a1f 0%, transparent 70%),
    var(--bg);
  color: var(--fg);
}

.enough__inner {
  position: relative;
  z-index: 1;
  max-width: var(--content-max);
  margin-inline: auto;
}

/*
  Everything rises into place once, when the section first appears. The demo
  window is excluded from the transform part: it has its own transform for
  the pointer tilt, and only fades in.
*/
[data-reveal]:not(.enough__panel) {
  opacity: 0;
  transform: translateY(1.4rem);
  transition:
    opacity 0.75s var(--ease-out),
    transform 0.75s var(--ease-out);
  transition-delay: calc(var(--reveal-delay, 0) * 1ms);
}

.enough[data-revealed='true'] [data-reveal]:not(.enough__panel) {
  opacity: 1;
  transform: none;
}

.enough__panel[data-reveal] {
  opacity: 0;
  transition:
    opacity 0.8s var(--ease-out),
    transform 0.45s var(--ease-out),
    border-color 0.35s var(--ease-out);
  transition-delay: calc(var(--reveal-delay, 0) * 1ms), 0ms, 0ms;
}

.enough[data-revealed='true'] .enough__panel[data-reveal] {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal],
  .enough__panel[data-reveal] {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* Eyebrow: "Selected project", with a slow pulsing dot. */
.enough__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--rule);
}

.enough__kicker {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--fg);
}

.enough__pulse {
  position: relative;
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--accent);
}

.enough__pulse::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(138, 162, 255, 0.5);
  animation: enough-pulse 2.6s var(--ease-out) infinite;
}

@keyframes enough-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(138, 162, 255, 0.45);
  }
  65%,
  100% {
    box-shadow: 0 0 0 0.7rem rgba(138, 162, 255, 0);
  }
}

.enough__count {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  color: var(--fg-muted);
}

.enough__word {
  --p: 1;
  margin: clamp(1.5rem, 4vw, 2.75rem) 0 0 -0.045em;
  font-size: clamp(4rem, 23vw, 19rem);
  font-weight: calc(650 - 450 * var(--p));
  line-height: 0.85;
  letter-spacing: -0.055em;
  /* The word sits on the digit field like type on a terminal. */
  text-shadow: 0 0 clamp(2rem, 6vw, 5rem) rgba(18, 20, 22, 0.85);
}

/* A hairline that draws itself in under the word. */
.enough__rule {
  height: 1px;
  margin: clamp(2rem, 5vw, 3.25rem) 0 clamp(2.5rem, 6vw, 4rem);
  background: linear-gradient(90deg, var(--accent), rgba(138, 162, 255, 0.15) 45%, transparent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 1.1s var(--ease-out) 0.25s;
}

.enough[data-revealed='true'] .enough__rule {
  transform: scaleX(1);
}

@media (prefers-reduced-motion: reduce) {
  .enough__rule {
    transform: scaleX(1);
    transition: none;
  }
}

.enough__grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: clamp(1rem, 3vw, 2.5rem);
  row-gap: clamp(3rem, 8vw, 5rem);
  align-items: start;
}

.enough__intro {
  grid-column: 1 / span 5;
}

.enough__visual {
  grid-column: 7 / span 6;
  display: grid;
  gap: clamp(2rem, 4vw, 3rem);
}

.enough__lede {
  max-width: 22em;
  font-size: var(--step-1);
  line-height: 1.3;
  letter-spacing: -0.015em;
}

/* Three reasons, numbered like a readme. */
.enough__highlights {
  margin-top: clamp(2rem, 4vw, 2.75rem);
  border-top: 1px solid var(--rule);
}

.enough__highlight {
  display: grid;
  grid-template-columns: 2.25rem minmax(0, 1fr);
  gap: 0 1rem;
  padding: 0.95rem 0 1.05rem;
  border-bottom: 1px solid var(--rule);
  transition:
    background-color 0.3s var(--ease-out),
    opacity 0.75s var(--ease-out),
    transform 0.75s var(--ease-out);
}

.enough__highlight:hover {
  background: linear-gradient(90deg, rgba(138, 162, 255, 0.07), transparent 70%);
}

.enough__hindex {
  padding-top: 0.15rem;
  font-family: var(--font-mono);
  font-size: var(--step--1);
  color: var(--accent);
}

.enough__htitle {
  margin: 0;
  font-size: var(--step-0);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.enough__htext {
  max-width: 30em;
  margin: 0.25rem 0 0;
  font-size: var(--step--1);
  line-height: 1.5;
  color: var(--fg-muted);
}

.enough__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.75rem;
  margin-top: clamp(1.75rem, 4vw, 2.5rem);
}

/* The demo in a small glass window. */
.enough__panel {
  --rx: 0deg;
  --ry: 0deg;
  --mx: 50%;
  --my: 0%;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--rule-strong);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(26, 30, 34, 0.94), rgba(16, 18, 20, 0.96));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.05) inset,
    0 2.5rem 5rem -2.5rem rgba(0, 0, 0, 0.9),
    0 0 0 1px rgba(138, 162, 255, 0.06);
  transform: perspective(1000px) rotateX(var(--rx)) rotateY(var(--ry));
  will-change: transform;
}

.enough__panel:hover {
  border-color: rgba(138, 162, 255, 0.45);
}

/* A soft highlight that follows the pointer across the glass. */
.enough__glare {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(
    22rem circle at var(--mx) var(--my),
    rgba(138, 162, 255, 0.14),
    transparent 65%
  );
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.4s var(--ease-out);
}

.enough__panel:hover .enough__glare {
  opacity: 1;
}

@media (prefers-reduced-motion: reduce) {
  .enough__panel {
    transform: none;
  }
}

.enough__chrome {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid var(--rule);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--fg-muted);
}

.enough__chrome-dots {
  display: inline-flex;
  gap: 0.3rem;
}

.enough__chrome-dots i {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: var(--rule-strong);
}

.enough__chrome-dots i:first-child {
  background: var(--accent);
}

.enough__chrome-title {
  color: var(--fg);
  white-space: nowrap;
}

.enough__chrome-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.enough__chrome-signal {
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0.5rem rgba(138, 162, 255, 0.9);
  animation: enough-blink 2.2s steps(1, end) infinite;
}

@keyframes enough-blink {
  0%,
  60% {
    opacity: 1;
  }
  61%,
  100% {
    opacity: 0.25;
  }
}

.enough__panel-body {
  padding: clamp(1.1rem, 3vw, 1.75rem);
}

/* The door to GitHub. */
.enough__elsewhere {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: clamp(1.5rem, 4vw, 3rem);
  margin-top: clamp(3rem, 7vw, 5rem);
  padding: clamp(1.35rem, 3vw, 2.25rem);
  border: 1px solid var(--rule-strong);
  border-radius: 8px;
  background:
    radial-gradient(120% 160% at 0% 0%, rgba(138, 162, 255, 0.12), transparent 62%),
    rgba(24, 27, 30, 0.6);
  transition:
    border-color 0.35s var(--ease-out),
    opacity 0.75s var(--ease-out),
    transform 0.75s var(--ease-out);
}

.enough__elsewhere:hover {
  border-color: rgba(138, 162, 255, 0.4);
}

.enough__elsewhere-copy {
  max-width: 38rem;
}

.enough__eyebrow {
  font-family: var(--font-mono);
  font-size: var(--step--1);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--fg-muted);
}

.enough__elsewhere-title {
  margin: 0.5rem 0 0;
  font-size: clamp(1.5rem, 1.1rem + 1.6vw, 2.25rem);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.enough__elsewhere-text {
  margin: 0.75rem 0 0;
  color: var(--fg-muted);
  line-height: 1.55;
}

.enough__elsewhere-link {
  flex: none;
  gap: 0.6rem;
}

.enough__elsewhere-mark {
  width: 1.05rem;
  height: 1.05rem;
}

.enough__arrow {
  transition: transform 0.35s var(--ease-out);
}

.enough__elsewhere-link:hover .enough__arrow,
.enough__elsewhere-link:focus-visible .enough__arrow {
  transform: translateX(0.25rem);
}

@media (max-width: 52rem) {
  .enough__intro,
  .enough__visual {
    grid-column: 1 / -1;
  }
}
</style>
