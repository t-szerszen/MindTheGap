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

function csvCell(v: string | number) {
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function wordsToCsv(
  words: (Pair & { example?: string; tags: string[]; attempts: number; correct: number })[],
) {
  const head = ['english', 'polish', 'example', 'tags', 'attempts', 'correct']
  const rows = words.map((w) =>
    [englishSide(w), polishSide(w), w.example ?? '', w.tags.join(', '), w.attempts, w.correct]
      .map(csvCell)
      .join(','),
  )
  return [head.join(','), ...rows].join('\n')
}

export type OwnCardFields = { en: string; pl: string; example: string; tag: string }

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim()

// własna fiszka z formularza: bez angielskiej albo polskiej strony nie ma czego powtarzać
export function buildOwnCard(f: OwnCardFields) {
  const term = tidy(f.en)
  const translation = tidy(f.pl)
  if (!term || !translation) return null
  const example = tidy(f.example)
  const tag = tidy(f.tag).toLowerCase()
  return {
    term,
    translation,
    direction: 'en-pl' as const,
    tags: tag ? [tag] : [],
    source: 'own' as const,
    ...(example ? { example } : {}),
  }
}
