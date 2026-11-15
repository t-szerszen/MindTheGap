// zdanie z luką: "By the time we arrived, the film ___ (start)."
const GAP = /___ \(([^()]+)\)/g

export type GapParts = { before: string; base: string; after: string }

export function countGaps(sentence: string) {
  return [...sentence.matchAll(GAP)].length
}

export function splitGap(sentence: string): GapParts | null {
  const m = [...sentence.matchAll(GAP)]
  const first = m[0]
  if (m.length !== 1 || !first || first.index === undefined) return null
  return {
    before: sentence.slice(0, first.index).trimEnd(),
    base: first[1]!.trim(),
    after: sentence.slice(first.index + first[0].length).trimStart(),
  }
}
