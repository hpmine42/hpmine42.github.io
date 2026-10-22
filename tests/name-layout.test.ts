import { describe, expect, it } from 'vitest'
import { splitName } from '../src/utils/name-layout'

const NAME = 'hpmine42'

describe('splitName', () => {
  it('keeps the whole name on one line on landscape screens', () => {
    const layout = splitName(NAME, 1440, 900)
    expect(layout.landscape).toBe(true)
    expect(layout.weight).toBe(700)
    expect(layout.lines).toEqual([NAME])
  })

  it('keeps the whole name on one line on a narrow portrait screen before the split', () => {
    const layout = splitName(NAME, 700, 900)
    expect(layout.landscape).toBe(false)
    expect(layout.weight).toBe(850)
    expect(layout.lines).toEqual([NAME])
  })

  it('splits the name in two halves on phones', () => {
    const layout = splitName(NAME, 390, 800)
    expect(layout.lines).toEqual(['hpmi', 'ne42'])
    // Both halves must add up to the name again, nothing lost, nothing doubled.
    expect(layout.lines.join('')).toBe(NAME)
  })

  it('does not split very short names', () => {
    expect(splitName('abc', 390, 800).lines).toEqual(['abc'])
  })

  it('rounds the split up, so the first line is never shorter', () => {
    const odd = splitName('abcdefg', 400, 800)
    expect(odd.lines).toEqual(['abcd', 'efg'])
  })

  it('treats a square viewport as landscape and a zero height as landscape', () => {
    expect(splitName(NAME, 500, 500).landscape).toBe(false)
    expect(splitName(NAME, 400, 0).lines).toEqual([NAME])
  })
})
