import { onBeforeUnmount, onMounted, type Ref } from 'vue'

/**
 * Writes a 0..1 scroll progress for `target` into a CSS custom property on the
 * element itself, without triggering Vue re-renders. 0 means the element is
 * just entering the bottom of the viewport, 1 means it has reached the upper
 * part of the screen. Listeners only run while the element is near the viewport.
 */
export function useScrollProgressVar(
  target: Ref<HTMLElement | null>,
  property: string,
  enabled: Ref<boolean>,
): void {
  let frame = 0
  let observer: IntersectionObserver | null = null

  const update = (): void => {
    frame = 0
    const element = target.value
    if (!element) return
    if (!enabled.value) {
      element.style.setProperty(property, '1')
      return
    }
    const viewport = window.innerHeight
    const top = element.getBoundingClientRect().top
    const progress = 1 - (top - viewport * 0.1) / (viewport * 0.8)
    element.style.setProperty(property, Math.min(1, Math.max(0, progress)).toFixed(3))
  }

  const schedule = (): void => {
    if (frame === 0) frame = requestAnimationFrame(update)
  }

  const attach = (): void => {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule, { passive: true })
    schedule()
  }

  const detach = (): void => {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
  }

  onMounted(() => {
    const element = target.value
    if (!element) return
    update()
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) attach()
        else detach()
      },
      { rootMargin: '25% 0px 25% 0px' },
    )
    observer.observe(element)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    detach()
    if (frame !== 0) cancelAnimationFrame(frame)
  })
}
