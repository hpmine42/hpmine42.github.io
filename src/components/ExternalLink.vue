<script setup lang="ts">
withDefaults(
  defineProps<{
    href: string
    primary?: boolean
  }>(),
  { primary: false },
)
</script>

<template>
  <a
    class="xlink"
    :class="{ 'xlink--primary': primary }"
    :href="href"
    target="_blank"
    rel="noopener noreferrer"
  >
    <span class="xlink__label"><slot /></span>
    <span class="xlink__arrow" aria-hidden="true">↗</span>
    <span class="visually-hidden"> (opens in a new tab)</span>
  </a>
</template>

<style scoped>
.xlink {
  display: inline-flex;
  align-items: baseline;
  gap: 0.35em;
  padding-block: 0.25em;
  font-family: var(--font-mono);
  font-size: var(--text-ui);
  color: var(--scene-fg);
  transition: color var(--dur-fast) ease;
}

.xlink__label {
  position: relative;
}

.xlink__label::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -0.2em;
  height: 1px;
  background: currentColor;
  transform-origin: left;
  transform: scaleX(0.35);
  transition: transform var(--dur-mid) var(--ease-out);
}

.xlink__arrow {
  display: inline-block;
  transition: transform var(--dur-mid) var(--ease-out);
}

.xlink--primary {
  font-family: var(--font-sans);
  font-size: var(--text-h3);
  font-weight: 700;
  letter-spacing: -0.02em;
}

.xlink--primary .xlink__label::after {
  height: 2px;
  bottom: -0.12em;
  background: var(--scene-accent);
  transform: scaleX(1);
}

@media (hover: hover) {
  .xlink:hover .xlink__label::after {
    transform: scaleX(1);
  }

  .xlink:hover .xlink__arrow {
    transform: translate(0.15em, -0.15em);
  }

  .xlink--primary:hover {
    color: var(--scene-accent);
  }
}

.xlink:focus-visible .xlink__label::after {
  transform: scaleX(1);
}
</style>
