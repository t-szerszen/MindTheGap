import type { Direction } from '../translate'

export type Pair = { term: string; translation: string; direction: Direction }

// term to zawsze to, co wpisałem do tłumacza; kierunek mówi, który bok jest angielski
export function englishSide(w: Pair) {
  return w.direction === 'en-pl' ? w.term : w.translation
}

export function polishSide(w: Pair) {
  return w.direction === 'en-pl' ? w.translation : w.term
}

export function normalizeText(s: string) {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[\s.!?…,;:]+$/, '')
    .trim()
}

// duplikat = ta sama angielska strona; polskie tłumaczenia mogą się różnić
export function findDuplicate<T extends Pair>(words: T[], candidate: Pair): T | undefined {
  const en = normalizeText(englishSide(candidate))
  if (!en) return undefined
  return words.find((w) => normalizeText(englishSide(w)) === en)
}

export function parseTags(input: string) {
  const out: string[] = []
  for (const raw of input.split(',')) {
    const t = raw.trim().toLowerCase()
    if (t && !out.includes(t)) out.push(t)
  }
  return out
}
