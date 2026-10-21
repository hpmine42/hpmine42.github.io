<script setup lang="ts">
import { profile } from '../data/content'
import ExternalLink from './ExternalLink.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__inner">
      <p class="site-footer__name">{{ profile.name }}</p>
      <ExternalLink :href="profile.githubUrl">{{ profile.githubLabel }}</ExternalLink>
      <p class="site-footer__year">© {{ year }}</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  padding: 1.75rem var(--gutter) calc(1.75rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--rule);
  background: var(--bg);
  color: var(--fg);
  font-size: var(--step--1);
}

.site-footer__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem 2rem;
  max-width: var(--content-max);
  margin-inline: auto;
}

.site-footer__name {
  font-weight: 650;
  letter-spacing: -0.01em;
}

.site-footer__year {
  color: var(--fg-muted);
}
</style>
