/** ASCII-only glyph set, so every character exists in the bundled mono font. */
export const GLYPHS: readonly string[] = '0123456789abcdef#$%&*+-/<=>?@[]{}|~'.split('')

export function randomGlyph(): string {
  return GLYPHS[Math.floor(Math.random() * GLYPHS.length)] ?? '0'
}

/** Length-preserving scramble. Whitespace is kept unless `keepSpaces` is false. */
export function scramble(text: string, keepSpaces = true): string {
  let out = ''
  for (const char of text) {
    out += keepSpaces && /\s/.test(char) ? char : randomGlyph()
  }
  return out
}

/** Deterministic integer hash mapped to [0, 1). */
export function hash3(a: number, b: number, c: number): number {
  let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^ Math.imul(c | 0, 1274126177)
  h = Math.imul(h ^ (h >>> 13), 1103515245)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}
