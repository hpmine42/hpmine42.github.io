import { describe, expect, it } from 'vitest'
import {
  advanceTrailLife,
  FRAME_MS,
  TRAIL_GROW_MS,
  TRAIL_HOLD_MS,
  TRAIL_RETRACT_MS,
} from '../src/utils/trail'

describe('advanceTrailLife', () => {
  it('does nothing while the pointer is inside and just moved', () => {
    expect(advanceTrailLife(1, { active: true, idleFor: 0, dt: 1 })).toBe(1)
    expect(advanceTrailLife(0.5, { active: true, idleFor: TRAIL_HOLD_MS, dt: 1 })).toBeGreaterThan(
      0.5,
    )
  })

  it('grows back at its own pace, not in a single frame', () => {
    const afterOneFrame = advanceTrailLife(0, { active: true, idleFor: 0, dt: 1 })
    expect(afterOneFrame).toBeGreaterThan(0)
    expect(afterOneFrame).toBeCloseTo(FRAME_MS / TRAIL_GROW_MS, 5)
  })

  it('reaches full length after TRAIL_GROW_MS of movement', () => {
    let life = 0
    const frames = Math.ceil(TRAIL_GROW_MS / FRAME_MS)
    for (let i = 0; i < frames; i += 1)
      life = advanceTrailLife(life, { active: true, idleFor: 0, dt: 1 })
    expect(life).toBe(1)
  })

  it('holds still for the short grace period, then retracts', () => {
    const holding = advanceTrailLife(1, { active: true, idleFor: TRAIL_HOLD_MS, dt: 1 })
    expect(holding).toBe(1)
    const retracting = advanceTrailLife(1, { active: true, idleFor: TRAIL_HOLD_MS + 50, dt: 1 })
    expect(retracting).toBeLessThan(1)
  })

  it('retracts to exactly zero and never below', () => {
    let life = 1
    const frames = Math.ceil(TRAIL_RETRACT_MS / FRAME_MS) + 10
    for (let i = 0; i < frames; i += 1) {
      life = advanceTrailLife(life, { active: true, idleFor: TRAIL_HOLD_MS + 100, dt: 1 })
    }
    expect(life).toBe(0)
  })

  it('drops to zero when the pointer leaves the field', () => {
    expect(advanceTrailLife(1, { active: false, idleFor: 0, dt: 1 })).toBeLessThan(1)
    let life = 1
    for (let i = 0; i < 200; i += 1)
      life = advanceTrailLife(life, { active: false, idleFor: 0, dt: 1 })
    expect(life).toBe(0)
  })

  it('never leaves the 0..1 range, even with odd input', () => {
    expect(advanceTrailLife(5, { active: true, idleFor: 0, dt: 100 })).toBe(1)
    expect(advanceTrailLife(-3, { active: true, idleFor: 0, dt: 1 })).toBeGreaterThanOrEqual(0)
    expect(
      advanceTrailLife(0.5, { active: true, idleFor: 0, dt: Number.NaN }),
    ).toBeGreaterThanOrEqual(0)
  })
})
