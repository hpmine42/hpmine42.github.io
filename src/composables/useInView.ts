import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export interface InViewOptions {
  /** Stop observing after the first intersection. Defaults to true. */
  once?: boolean
  rootMargin?: string
  threshold?: number
}

/** Tracks whether an element intersects the viewport. */
export function useInView(
  getTarget: () => Element | null | undefined,
  options: InViewOptions = {},
): Ref<boolean> {
  const { once = true, rootMargin = '0px 0px -12% 0px', threshold = 0 } = options
  const inView = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    const target = getTarget()
    if (!target) return
    if (typeof IntersectionObserver === 'undefined') {
      inView.value = true
      return
    }
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inView.value = entry.isIntersecting
          if (entry.isIntersecting && once) {
            observer?.disconnect()
            observer = null
            return
          }
        }
      },
      { rootMargin, threshold },
    )
    observer.observe(target)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return inView
}
