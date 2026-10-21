import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Tracks which section crosses a thin band in the middle of the viewport.
 * Used for the `aria-current` state of the navigation.
 */
export function useActiveSection(ids: readonly string[]): Ref<string> {
  const active = ref(ids[0] ?? '')
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) active.value = entry.target.id
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
  })

  onBeforeUnmount(() => observer?.disconnect())

  return active
}
