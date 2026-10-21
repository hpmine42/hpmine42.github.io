import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

const QUERY = '(prefers-reduced-motion: reduce)'

/** Reactive `prefers-reduced-motion` flag that follows OS-level changes. */
export function usePrefersReducedMotion(): Ref<boolean> {
  const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY)
    : null
  const reduced = ref(media?.matches ?? false)

  const update = (event: MediaQueryListEvent): void => {
    reduced.value = event.matches
  }

  onMounted(() => media?.addEventListener('change', update))
  onBeforeUnmount(() => media?.removeEventListener('change', update))

  return reduced
}
