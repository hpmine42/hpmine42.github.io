<script setup lang="ts">
import { about, profile } from '../data/content'
import ExternalLink from './ExternalLink.vue'
import GitHubMark from './GitHubMark.vue'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer">
    <p class="site-footer__about">{{ about }}</p>
    <div class="site-footer__inner">
      <p class="site-footer__name">{{ profile.name }}</p>
      <ExternalLink class="site-footer__link" :href="profile.githubUrl">
        <GitHubMark class="site-footer__mark" />
        {{ profile.githubLabel }}
      </ExternalLink>
      <p class="site-footer__year">© {{ year }}</p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  padding: clamp(2rem, 4vw, 2.75rem) var(--gutter) calc(1.75rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--rule);
  background: var(--bg);
  color: var(--fg);
  font-size: var(--step--1);
}

.site-footer__about {
  max-width: 46ch;
  margin-bottom: clamp(1.25rem, 3vw, 1.75rem);
  color: var(--fg-muted);
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

.site-footer__link {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  /* No underline here: the external-link style would draw one. */
  background-image: none;
  padding-bottom: 0;
  transition: color 0.25s var(--ease-out);
}

.site-footer__link:hover,
.site-footer__link:focus-visible {
  background-image: none;
  color: var(--signal);
}

.site-footer__mark {
  width: 0.95rem;
  height: 0.95rem;
  margin-top: -0.1em;
}

.site-footer__name {
  font-weight: 650;
  letter-spacing: -0.01em;
}

.site-footer__year {
  color: var(--fg-muted);
}
</style>
