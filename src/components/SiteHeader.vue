<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { profile, sections } from '../data/content'
import GitHubMark from './GitHubMark.vue'

const props = defineProps<{ active: string }>()

// The brand on the left already is the link to the top of the page, so the
// section list only holds the sections below the hero.
const navItems = computed(() => sections.filter((item) => item.id !== 'top'))

const list = ref<HTMLElement | null>(null)
/** Scrolled past the hero top: the bar turns into dark glass. */
const scrolled = ref(false)
/** Sliding highlight behind the current section link. */
const indicator = ref({ x: 0, width: 0, visible: false })

let frame = 0
let resizeObserver: ResizeObserver | null = null

/** Puts the highlight exactly behind the link of the current section. */
function placeIndicator(): void {
  const nav = list.value
  if (!nav || props.active === 'top') {
    indicator.value = { ...indicator.value, visible: false }
    return
  }
  const link = nav.querySelector<HTMLElement>(`[data-section="${props.active}"]`)
  if (!link) {
    indicator.value = { ...indicator.value, visible: false }
    return
  }
  indicator.value = {
    x: link.offsetLeft,
    width: link.offsetWidth,
    visible: true,
  }
}

function update(): void {
  frame = 0
  scrolled.value = window.scrollY > 16
  placeIndicator()
}

function schedule(): void {
  if (frame === 0) frame = requestAnimationFrame(update)
}

watch(
  () => props.active,
  () => placeIndicator(),
)

onMounted(() => {
  update()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule, { passive: true })
  if (list.value) {
    resizeObserver = new ResizeObserver(() => placeIndicator())
    resizeObserver.observe(list.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  resizeObserver?.disconnect()
  if (frame !== 0) cancelAnimationFrame(frame)
})
</script>

<template>
  <header class="site-header" :data-scrolled="scrolled ? 'true' : 'false'">
    <nav class="site-header__bar" aria-label="Primary">
      <a class="site-header__brand" href="#top">
        <span class="site-header__mark" aria-hidden="true">
          <i /><i /><i /><i /><i /><i /><i /><i /><i />
        </span>
        <span>{{ profile.name }}</span>
      </a>

      <div class="site-header__links">
        <span
          class="site-header__indicator"
          :class="{ 'site-header__indicator--visible': indicator.visible }"
          aria-hidden="true"
          :style="{ transform: `translateX(${indicator.x}px)`, width: `${indicator.width}px` }"
        />

        <ul ref="list" class="site-header__list">
          <li v-for="item in navItems" :key="item.id">
            <a
              class="site-header__link"
              :href="`#${item.id}`"
              :data-section="item.id"
              :aria-current="active === item.id ? 'location' : undefined"
            >
              {{ item.label }}
            </a>
          </li>

          <li class="site-header__github-item">
            <a
              class="site-header__github"
              :href="profile.githubUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubMark class="site-header__github-mark" />
              <span class="site-header__github-label">GitHub</span>
              <span class="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<style scoped>
/*
  A floating navigation pill. At the very top of the page it is invisible
  itself and only the text sits on the hero; after a little scroll the bar
  fades in as dark glass so the links stay readable over the dot field and
  over the enough. section. It never blocks the pointer: only the links take
  pointer events, so the hero's dot field stays interactive underneath.
*/
.site-header {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 50;
  padding: clamp(0.6rem, 1.5vw, 1rem) var(--gutter);
  pointer-events: none;
}

.site-header__bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(0.75rem, 2vw, 2rem);
  max-width: var(--content-max);
  margin-inline: auto;
  padding: 0.2rem 0.3rem 0.2rem 0.9rem;
  /* Barely more than a hint of glass from the start — the points of the hero
     show through — and a little denser after scrolling. Corners stay almost
     square, so the bar reads as a strip rather than a pill. */
  border: 1px solid rgba(138, 162, 255, 0.07);
  border-radius: 6px;
  background: rgba(18, 20, 22, 0.16);
  backdrop-filter: blur(10px) saturate(1.1);
  transition:
    background-color 0.45s var(--ease-out),
    border-color 0.45s var(--ease-out),
    box-shadow 0.45s var(--ease-out),
    backdrop-filter 0.45s var(--ease-out);
}

.site-header[data-scrolled='true'] .site-header__bar {
  border-color: rgba(138, 162, 255, 0.14);
  background: rgba(18, 20, 22, 0.5);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.04) inset,
    0 1rem 2.5rem -1.5rem rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(16px) saturate(1.2);
}

/* Without backdrop-filter the pane would be nearly invisible: use a solid one. */
@supports not (backdrop-filter: blur(1px)) {
  .site-header__bar {
    background: rgba(18, 20, 22, 0.6);
  }

  .site-header[data-scrolled='true'] .site-header__bar {
    background: rgba(18, 20, 22, 0.78);
  }
}

/* Brand: the name plus a tiny dot-matrix glyph with one lit dot. */
.site-header__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-height: 2.75rem;
  color: var(--paper);
  font-size: var(--step--1);
  font-weight: 650;
  letter-spacing: -0.01em;
  text-decoration: none;
  pointer-events: auto;
}

.site-header__mark {
  display: grid;
  grid-template-columns: repeat(3, 3px);
  gap: 2px;
}

.site-header__mark i {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--paper-muted);
  opacity: 0.55;
  transition:
    opacity 0.3s var(--ease-out),
    background-color 0.3s var(--ease-out);
}

.site-header__mark i:nth-child(5) {
  background: var(--signal);
  opacity: 1;
}

.site-header__brand:hover .site-header__mark i,
.site-header__brand:focus-visible .site-header__mark i {
  opacity: 1;
}

.site-header__links {
  position: relative;
}

.site-header__list {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* The pill that slides from one section link to the other. */
.site-header__indicator {
  position: absolute;
  top: 50%;
  left: 0;
  height: 2.15rem;
  margin-top: -1.075rem;
  border: 1px solid rgba(138, 162, 255, 0.22);
  border-radius: 4px;
  background: rgba(138, 162, 255, 0.1);
  opacity: 0;
  transition:
    transform 0.45s var(--ease-out),
    width 0.45s var(--ease-out),
    opacity 0.3s var(--ease-out);
}

.site-header__indicator--visible {
  opacity: 1;
}

.site-header__link {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0 0.7rem;
  border-radius: 4px;
  color: var(--paper-muted);
  font-size: var(--step--1);
  font-weight: 500;
  text-decoration: none;
  pointer-events: auto;
  transition: color 0.3s var(--ease-out);
}

.site-header__link:hover,
.site-header__link:focus-visible,
.site-header__link[aria-current='location'] {
  color: var(--paper);
}

.site-header__github-item {
  margin-left: 0.35rem;
}

.site-header__github {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.35rem;
  margin-block: 0.2rem;
  padding: 0 0.85rem;
  border: 1px solid var(--graphite-line-strong);
  border-radius: 4px;
  color: var(--paper);
  font-size: var(--step--1);
  font-weight: 500;
  text-decoration: none;
  pointer-events: auto;
  transition:
    border-color 0.3s var(--ease-out),
    background-color 0.3s var(--ease-out),
    color 0.3s var(--ease-out);
}

.site-header__github:hover,
.site-header__github:focus-visible {
  border-color: rgba(138, 162, 255, 0.6);
  background: rgba(138, 162, 255, 0.12);
  color: var(--signal);
}

.site-header__github-mark {
  width: 0.95rem;
  height: 0.95rem;
}

.site-header__link:focus-visible,
.site-header__github:focus-visible,
.site-header__brand:focus-visible {
  outline: 2px solid var(--signal);
  outline-offset: 2px;
}

/* Narrow screens: the brand keeps its name, the GitHub button loses the label
   and the section links lose some air. */
@media (max-width: 30rem) {
  .site-header__bar {
    padding-left: 0.7rem;
  }

  .site-header__github {
    padding: 0 0.6rem;
  }

  .site-header__github-label {
    display: none;
  }

  .site-header__link {
    padding: 0 0.5rem;
  }
}
</style>
