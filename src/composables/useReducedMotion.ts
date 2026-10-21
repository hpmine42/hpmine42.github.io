import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Reactive `prefers-reduced-motion: reduce`. */
export function useReducedMotion(): Ref<boolean> {
  const query =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null
  const reduced = ref(query?.matches ?? false)

  const onChange = (event: MediaQueryListEvent): void => {
    reduced.value = event.matches
  }

  onMounted(() => query?.addEventListener('change', onChange))
  onBeforeUnmount(() => query?.removeEventListener('change', onChange))

  return reduced
}
