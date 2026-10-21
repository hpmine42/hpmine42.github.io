<script setup lang="ts">
import GlyphField from './GlyphField.vue'
import ScrambleText from './ScrambleText.vue'

const NAME = 'Jakob'
const letters = NAME.split('')
</script>

<template>
  <section id="top" class="hero" aria-labelledby="hero-title">
    <GlyphField class="hero__field" />

    <div class="hero__inner">
      <h1 id="hero-title" class="hero__name">
        <span class="visually-hidden">{{ NAME }}</span>
        <span class="hero__word" aria-hidden="true">
          <span
            v-for="(letter, index) in letters"
            :key="index"
            class="hero__letter"
            :style="{ '--i': index }"
          >{{ letter }}</span>
          <span class="hero__caret"></span>
        </span>
      </h1>

      <div class="hero__meta">
        <p class="hero__id mono">
          <span class="hero__role">developer</span>
          <ScrambleText text="hpmine42" :delay="650" />
        </p>
        <p class="hero__line">Two projects,<br />both private by design.</p>
        <a class="hero__cue mono" href="#enough">
          work<span class="hero__arrow" aria-hidden="true">↓</span>
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  --field-dot: rgb(236 233 225 / 0.13);
  --field-glyph: var(--bone);
  --field-accent: var(--signal);

  position: relative;
  isolation: isolate;
  display: grid;
  align-items: end;
  min-height: 100svh;
  padding: calc(var(--nav-h) + var(--s-6)) var(--gutter) var(--s-4);
  overflow: hidden;
}

.hero__field {
  position: absolute;
  inset: 0;
  z-index: -1;
  -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent 96%);
  mask-image: linear-gradient(to bottom, #000 55%, transparent 96%);
}

.hero__inner {
  width: 100%;
  max-width: var(--max);
  margin-inline: auto;
}

.hero__name {
  font-size: var(--text-display);
  font-weight: 800;
  line-height: 0.8;
  letter-spacing: -0.065em;
  margin-left: -0.055em;
}

.hero__word {
  display: inline-flex;
  align-items: baseline;
  overflow: hidden;
  padding: 0.08em 0.1em 0.12em 0.06em;
  margin: -0.08em -0.1em -0.12em -0.06em;
}

.hero__letter {
  display: inline-block;
  transform: translateY(110%);
  animation: rise 1100ms var(--ease-out) forwards;
  animation-delay: calc(var(--i) * 70ms + 120ms);
}

.hero__caret {
  display: inline-block;
  width: 0.085em;
  height: 0.64em;
  margin-left: 0.11em;
  background: var(--signal);
  animation: blink 1.1s steps(1, end) 1.6s infinite;
}

.hero__meta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto;
  align-items: end;
  gap: var(--s-4);
  margin-top: var(--s-4);
  padding-top: var(--s-3);
  border-top: 1px solid var(--ink-line);
}

.hero__id {
  display: flex;
  flex-direction: column;
  gap: 0.15em;
}

.hero__role {
  color: var(--bone-dim);
}

.hero__line {
  font-size: var(--text-lede);
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.hero__cue {
  display: inline-flex;
  align-items: center;
  gap: 0.6em;
  padding: 0.5rem 0;
  color: var(--bone-dim);
  transition: color var(--dur-fast) ease;
}

.hero__arrow {
  display: inline-block;
  animation: nudge 2.4s var(--ease-in-out) 2s infinite;
}

@media (hover: hover) {
  .hero__cue:hover {
    color: var(--bone);
  }
}

@media (max-width: 40rem) {
  .hero__meta {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .hero__line {
    grid-column: 1 / -1;
    grid-row: 1;
  }
}

@keyframes rise {
  to {
    transform: translateY(0);
  }
}

@keyframes blink {
  0%,
  55% {
    opacity: 1;
  }
  56%,
  100% {
    opacity: 0;
  }
}

@keyframes nudge {
  0%,
  70%,
  100% {
    transform: translateY(0);
  }
  85% {
    transform: translateY(0.3em);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__letter,
  .hero__caret,
  .hero__arrow {
    animation: none;
    transform: none;
  }
}
</style>
