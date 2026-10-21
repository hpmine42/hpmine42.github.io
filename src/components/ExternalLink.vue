<script setup lang="ts">
withDefaults(
  defineProps<{
    href: string
    variant?: 'button' | 'text'
  }>(),
  { variant: 'text' },
)
</script>

<template>
  <a :class="['ext', `ext--${variant}`]" :href="href" target="_blank" rel="noopener noreferrer">
    <slot />
    <span class="sr-only"> (opens in a new tab)</span>
  </a>
</template>

<style scoped>
.ext {
  color: inherit;
  text-decoration: none;
}

.ext--text {
  background-image: linear-gradient(currentColor, currentColor);
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 100% 1px;
  padding-bottom: 0.15em;
  transition: background-size 0.35s var(--ease-out);
}

.ext--text:hover,
.ext--text:focus-visible {
  background-size: 0 1px;
  background-position: 100% 100%;
}

.ext--button {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.55rem 1.25rem;
  border: 1px solid currentColor;
  border-radius: var(--radius);
  font-weight: 500;
  transition:
    background-color 0.25s var(--ease-out),
    color 0.25s var(--ease-out);
}

.ext--button:hover,
.ext--button:focus-visible {
  background: var(--fg);
  color: var(--bg);
}
</style>
