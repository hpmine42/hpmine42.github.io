<script setup lang="ts">
import { computed, ref } from 'vue'
import { elsewhere, enough } from '../data/content'
import { useReducedMotion } from '../composables/useReducedMotion'
import { useScrollProgressVar } from '../composables/useScrollProgressVar'
import EnoughBackdrop from './EnoughBackdrop.vue'
import EnoughThread from './EnoughThread.vue'
import ExternalLink from './ExternalLink.vue'
import FactList from './FactList.vue'

const reduced = useReducedMotion()
const word = ref<HTMLElement | null>(null)

// The title gets lighter as it scrolls into place: less, but enough.
useScrollProgressVar(
  word,
  '--p',
  computed(() => !reduced.value),
)
</script>

<template>
  <section id="enough" class="enough" aria-labelledby="enough-title">
    <EnoughBackdrop />

    <div class="enough__inner">
      <!-- One selected project, clearly labelled as such. -->
      <div class="enough__meta">
        <p class="enough__kicker">
          <span class="enough__pulse" aria-hidden="true" />
          {{ enough.kicker }}
        </p>
        <p class="enough__count" aria-hidden="true">01 / 01</p>
      </div>

      <h2 id="enough-title" ref="word" class="enough__word">{{ enough.name }}</h2>

      <div class="enough__grid">
        <div class="enough__intro">
          <p class="enough__lede">{{ enough.summary }}</p>

          <ol class="enough__highlights">
            <li v-for="(item, index) in enough.highlights" :key="item.title" class="enough__highlight">
              <span class="enough__hindex" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
              <div>
                <h3 class="enough__htitle">{{ item.title }}</h3>
                <p class="enough__htext">{{ item.text }}</p>
              </div>
            </li>
          </ol>

          <div class="enough__actions">
            <ExternalLink :href="enough.liveUrl" variant="button">Open enough.</ExternalLink>
            <ExternalLink :href="enough.repoUrl">Source on GitHub</ExternalLink>
          </div>
        </div>

        <div class="enough__visual">
          <!-- The demo, framed like a small app window. -->
          <div class="enough__panel">
            <div class="enough__chrome" aria-hidden="true">
              <span class="enough__chrome-dots"><i /><i /><i /></span>
              <span class="enough__chrome-title">enough. — end-to-end</span>
              <span class="enough__chrome-meta">1:1 · signal</span>
            </div>
            <div class="enough__panel-body">
              <EnoughThread />
            </div>
          </div>

          <FactList :facts="enough.facts" />
        </div>
      </div>

      <!-- The rest of the work: one clear door to GitHub. -->
      <aside class="enough__elsewhere" aria-labelledby="elsewhere-title">
        <div class="enough__elsewhere-copy">
          <p class="enough__eyebrow">{{ elsewhere.eyebrow }}</p>
          <h3 id="elsewhere-title" class="enough__elsewhere-title">{{ elsewhere.title }}</h3>
          <p class="enough__elsewhere-text">{{ elsewhere.text }}</p>
        </div>

        <ExternalLink class="enough__elsewhere-link" :href="elsewhere.url" variant="button">
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
  margin: clamp(1.5rem, 4vw, 2.75rem) 0 clamp(2.5rem, 7vw, 5.5rem) -0.045em;
  font-size: clamp(4rem, 23vw, 19rem);
  font-weight: calc(650 - 450 * var(--p));
  line-height: 0.85;
  letter-spacing: -0.055em;
  /* The word sits on the digit field like type on a terminal. */
  text-shadow: 0 0 clamp(2rem, 6vw, 5rem) rgba(18, 20, 22, 0.85);
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

/* The demo in a small window frame. */
.enough__panel {
  overflow: hidden;
  border: 1px solid var(--rule-strong);
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(26, 30, 34, 0.92), rgba(18, 20, 22, 0.92));
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 2rem 4rem -2rem rgba(0, 0, 0, 0.8);
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
}

.enough__chrome-meta {
  margin-left: auto;
  font-size: 0.6875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
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
    radial-gradient(120% 160% at 0% 0%, rgba(138, 162, 255, 0.1), transparent 62%),
    rgba(24, 27, 30, 0.6);
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
