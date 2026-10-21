import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export type SceneId = 'top' | 'enough' | 'aiko'

export const SCENES: readonly SceneId[] = ['top', 'enough', 'aiko']

function isScene(id: string): id is SceneId {
  return (SCENES as readonly string[]).includes(id)
}

/**
 * Reports which scene section currently crosses the middle of the viewport.
 * Sections are matched by element id.
 */
export function useActiveScene(): Ref<SceneId> {
  const active = ref<SceneId>('top')
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (typeof IntersectionObserver === 'undefined') return
    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && isScene(entry.target.id)) {
            active.value = entry.target.id
          }
        }
      },
      { rootMargin: '-48% 0px -51% 0px', threshold: 0 },
    )
    for (const id of SCENES) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return active
}
