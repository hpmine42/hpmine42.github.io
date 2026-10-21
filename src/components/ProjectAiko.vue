<script setup lang="ts">
import { useTemplateRef } from 'vue'
import EngineTrace from './EngineTrace.vue'
import ExternalLink from './ExternalLink.vue'
import FactList from './FactList.vue'
import { aiko } from '../data/projects'
import { useInView } from '../composables/useInView'

const root = useTemplateRef<HTMLElement>('root')
const inView = useInView(() => root.value)
</script>

<template>
  <section id="aiko" ref="root" class="aiko" :class="{ 'is-in': inView }" aria-labelledby="aiko-title">
    <div class="aiko__inner">
      <div class="aiko__head">
        <p class="label">project / assistant</p>
        <h2 id="aiko-title" class="aiko__title">Aiko</h2>
        <p class="aiko__lede">
          A chat assistant that runs entirely on the device. Fixed rules, no language model, no
          internet.
        </p>

        <figure class="aiko__code">
          <figcaption class="label">rule code</figcaption>
          <pre><code><span class="aiko__key">regel:</span> =hallo
<span class="aiko__key">antwort:</span> Hallo {name}! Wie kann ich helfen?</code></pre>
        </figure>

        <FactList class="aiko__facts" :facts="aiko.facts" variant="inline" />

        <div class="aiko__links">
          <ExternalLink :href="aiko.live" primary>Open Aiko</ExternalLink>
          <ExternalLink :href="aiko.source">Source on GitHub</ExternalLink>
        </div>
      </div>

      <EngineTrace class="aiko__trace" />
    </div>
  </section>
</template>

<style scoped>
.aiko {
  padding: var(--s-7) var(--gutter);
}

.aiko__inner {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  column-gap: var(--s-4);
  row-gap: var(--s-6);
  max-width: var(--max);
  margin-inline: auto;
}

.aiko__head {
  grid-column: 1 / span 5;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.aiko__title {
  margin-top: var(--s-3);
  font-family: var(--font-mono);
  font-size: clamp(4rem, 1rem + 9vw, 9.5rem);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.06em;
  margin-left: -0.04em;
  color: var(--amber);
  clip-path: inset(0 100% 0 0);
  transition: clip-path 1000ms steps(4, end);
}

.is-in .aiko__title {
  clip-path: inset(0 -0.2em 0 0);
}

.aiko__lede {
  margin-top: var(--s-4);
  max-width: 26rem;
  font-size: var(--text-lede);
  font-weight: 500;
  line-height: 1.3;
}

.aiko__code {
  margin-top: var(--s-5);
}

.aiko__code pre {
  margin-top: var(--s-1);
  padding: var(--s-3);
  font-family: var(--font-mono);
  font-size: var(--text-ui);
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--bone);
  background: var(--ink-raised);
  border-left: 2px solid var(--amber-dim);
}

.aiko__key {
  color: var(--amber);
}

.aiko__facts {
  margin-top: var(--s-5);
}

.aiko__links {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-2) var(--s-5);
  margin-top: var(--s-5);
}

.aiko__trace {
  grid-column: 7 / -1;
  align-self: start;
  padding-top: calc(var(--s-3) + 0.5rem);
}

@media (max-width: 60rem) {
  .aiko__head,
  .aiko__trace {
    grid-column: 1 / -1;
  }

  .aiko__trace {
    padding-top: 0;
  }
}
</style>
