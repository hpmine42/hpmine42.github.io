<script setup lang="ts">
import { useTemplateRef } from 'vue'
import CipherWire from './CipherWire.vue'
import ExternalLink from './ExternalLink.vue'
import FactList from './FactList.vue'
import { enough } from '../data/projects'
import { useInView } from '../composables/useInView'

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(() => root.value)
</script>

<template>
  <section id="enough" ref="root" class="enough" :class="{ 'is-in': inView }" aria-labelledby="enough-title">
    <div class="enough__inner">
      <p class="enough__label label">project / messenger</p>

      <h2 id="enough-title" class="enough__title">
        enough<span class="enough__dot">.</span>
      </h2>

      <p class="enough__lede">
        A private 1:1 messenger.<br />
        Defined by what it leaves out.
      </p>

      <CipherWire class="enough__wire" message="see you at eight" />

      <FactList class="enough__facts" :facts="enough.facts" variant="rows" />

      <div class="enough__links">
        <ExternalLink :href="enough.live" primary>Open enough.</ExternalLink>
        <ExternalLink :href="enough.source">Source on GitHub</ExternalLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.enough {
  padding: var(--s-7) var(--gutter);
}

.enough__inner {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--s-4);
  max-width: var(--max);
  margin-inline: auto;
}

.enough__label {
  grid-column: 1 / -1;
  margin-bottom: var(--s-3);
}

.enough__title {
  grid-column: 1 / span 8;
  font-size: var(--text-title);
  font-weight: 800;
  line-height: 0.82;
  letter-spacing: -0.065em;
  margin-left: -0.05em;
  opacity: 0;
  transform: translateY(0.14em);
  transition:
    opacity 900ms var(--ease-out),
    transform 1100ms var(--ease-out);
}

.enough__dot {
  color: var(--signal);
  display: inline-block;
  transform: scale(0.4);
  transform-origin: 50% 85%;
  transition: transform 700ms var(--ease-out) 550ms;
}

.enough__lede {
  grid-column: 9 / -1;
  align-self: end;
  font-size: var(--text-lede);
  font-weight: 500;
  line-height: 1.3;
  opacity: 0;
  transition: opacity 900ms var(--ease-out) 300ms;
}

.is-in .enough__title,
.is-in .enough__lede {
  opacity: 1;
  transform: none;
}

.is-in .enough__dot {
  transform: none;
}

.enough__wire {
  grid-column: 1 / -1;
  margin-top: var(--s-6);
}

.enough__facts {
  grid-column: 1 / span 7;
  margin-top: var(--s-4);
}

.enough__links {
  grid-column: 9 / -1;
  align-self: end;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--s-3);
  margin-top: var(--s-4);
}

@media (max-width: 60rem) {
  .enough__title,
  .enough__lede,
  .enough__facts,
  .enough__links {
    grid-column: 1 / -1;
  }

  .enough__lede {
    margin-top: var(--s-4);
  }

  .enough__links {
    margin-top: var(--s-5);
  }
}
</style>
