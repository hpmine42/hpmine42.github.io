<script setup lang="ts">
import { links } from '../data/projects'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="footer">
    <div class="footer__inner">
      <p class="footer__name">Jakob<span class="footer__caret" aria-hidden="true"></span></p>
      <a class="footer__link" :href="links.github" target="_blank" rel="me noopener noreferrer">
        github.com/hpmine42<span aria-hidden="true">&nbsp;↗</span>
        <span class="visually-hidden"> (opens in a new tab)</span>
      </a>
      <a class="footer__link footer__top" href="#top">
        top<span aria-hidden="true">&nbsp;↑</span>
      </a>
      <p class="footer__meta">© {{ year }}</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  padding: var(--s-5) var(--gutter) var(--s-4);
}

.footer__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: baseline;
  gap: var(--s-2) var(--s-5);
  max-width: var(--max);
  margin-inline: auto;
  padding-top: var(--s-4);
  border-top: 1px solid var(--scene-line);
  font-family: var(--font-mono);
  font-size: var(--text-ui);
}

.footer__name {
  font-family: var(--font-sans);
  font-size: var(--text-h3);
  font-weight: 800;
  letter-spacing: -0.04em;
}

.footer__caret {
  display: inline-block;
  width: 0.09em;
  height: 0.7em;
  margin-left: 0.08em;
  background: var(--signal);
}

.footer__link {
  padding-block: 0.5rem;
  color: var(--scene-muted);
  transition: color var(--dur-fast) ease;
}

@media (hover: hover) {
  .footer__link:hover {
    color: var(--scene-fg);
  }
}

.footer__meta {
  grid-column: 1 / -1;
  color: var(--scene-muted);
}

@media (max-width: 36rem) {
  .footer__inner {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .footer__name {
    grid-column: 1 / -1;
  }
}
</style>
