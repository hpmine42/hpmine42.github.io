/** A resting pointer keeps its tail this long, then the tail retracts. */
export const TRAIL_HOLD_MS = 120
/** Time the tail needs to pull itself fully into the head. */
export const TRAIL_RETRACT_MS = 520
/** Time the tail needs to unroll again once the pointer moves. */
export const TRAIL_GROW_MS = 260
/** One frame at 60 Hz, in milliseconds. */
export const FRAME_MS = 16.667

export interface TrailState {
  /** The pointer is inside the field. */
  readonly active: boolean
  /** Milliseconds since the last real pointer movement. */
  readonly idleFor: number
  /** Frame delta, in frames (1 = 60 Hz). */
  readonly dt: number
}

/**
 * Advances the "how much trail is left" value (1 = full, 0 = gone).
 *
 * It is never set straight from one end to the other: while the pointer moves
 * it grows back over `TRAIL_GROW_MS`, and while it rests it retracts over
 * `TRAIL_RETRACT_MS`. That way the tail unrolls out of the head instead of
 * popping in from nothing.
 */
export function advanceTrailLife(life: number, { active, idleFor, dt }: TrailState): number {
  // A broken timestamp must not turn the tail into NaN and freeze the field:
  // fall back to one frame.
  const frames = Number.isFinite(dt) && dt > 0 ? dt : 1
  const down = frames * (FRAME_MS / TRAIL_RETRACT_MS)
  const up = frames * (FRAME_MS / TRAIL_GROW_MS)
  const current = Number.isFinite(life) ? Math.min(1, Math.max(0, life)) : 0
  if (!active) return Math.max(0, current - down)
  if (idleFor <= TRAIL_HOLD_MS) return Math.min(1, current + up)
  return Math.max(0, current - down)
}
