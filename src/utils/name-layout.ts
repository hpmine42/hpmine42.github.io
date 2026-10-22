/** How the name is broken into lines and how heavy it is drawn. */
export interface NameLayout {
  readonly landscape: boolean
  readonly weight: number
  readonly lines: readonly string[]
}

/**
 * Decides the type weight and the line split for the dot-matrix name.
 *
 * On narrow screens the whole word on one line comes out far too small: at
 * phone width each letter would be only a few dots wide and the stems would
 * run into each other. There the name is split into two halves ("hpmi" /
 * "ne42"), which allows roughly double the letter size.
 */
export function splitName(text: string, width: number, height: number): NameLayout {
  const landscape = width > height
  // Narrow screens get a heavier weight so the letters keep enough dots per stem.
  const weight = landscape ? 700 : 850
  const twoLines = !landscape && width < 680 && text.length > 6 && height > 0
  if (!twoLines) return { landscape, weight, lines: [text] }
  const splitAt = Math.ceil(text.length / 2)
  return { landscape, weight, lines: [text.slice(0, splitAt), text.slice(splitAt)] }
}
