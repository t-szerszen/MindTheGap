// zaznaczanie słówek w tekście: czyszczenie zaznaczenia, zdanie wokół niego, miejsce na dymek

export const PICK_MAX_CHARS = 60
export const PICK_MAX_WORDS = 6
const SENTENCE_MAX = 240

const edgeJunk = /^[\s"'“”‘’„«»()[\]{}.,;:!?…*_–—-]+|[\s"'“”‘’„«»()[\]{}.,;:!?…*_–—-]+$/g

export function isEnglishLang(lang: string | null | undefined) {
  return !!lang && /^en\b/i.test(lang)
}

// null = nie pokazujemy dymka
export function normalizeSelection(raw: string): string | null {
  const text = raw.replace(/\s+/g, ' ').replace(edgeJunk, '').replace(/’/g, "'")
  if (!text || !/[a-z]/i.test(text)) return null
  if (text.length > PICK_MAX_CHARS) return null
  if (text.split(' ').length > PICK_MAX_WORDS) return null
  return text
}

// skróty, po których kropka nie kończy zdania
const abbreviations = new Set(['mr', 'mrs', 'ms', 'dr', 'st', 'prof', 'e.g', 'i.e', 'etc', 'vs'])

function endsSentence(text: string, i: number) {
  const ch = text[i]
  if (ch === '\n') return true
  if (!'.!?…'.includes(ch!)) return false
  const next = text[i + 1]
  if (next !== undefined && !/[\s"'”’)]/.test(next)) return false
  if (ch === '.') {
    const word = /([a-z.]+)$/i.exec(text.slice(0, i))?.[1]?.toLowerCase()
    if (word && abbreviations.has(word)) return false
  }
  return true
}

// start i end to pozycje zaznaczenia w całym tekście akapitu
export function extractSentence(text: string, start: number, end: number): string {
  let from = start
  while (from > 0 && !endsSentence(text, from - 1)) from--
  let to = Math.max(end, start)
  while (to < text.length && !endsSentence(text, to)) to++
  // zamykający cudzysłów albo nawias zostaje przy zdaniu
  while (to < text.length && /[.!?…"'”’)]/.test(text[to]!)) to++

  let sentence = text.slice(from, to)
  let selStart = start - from
  let selEnd = end - from
  const lead = sentence.length - sentence.trimStart().length
  sentence = sentence.trim()
  selStart -= lead
  selEnd -= lead

  if (sentence.length > SENTENCE_MAX) {
    // za długie zdanie: tniemy okno wokół zaznaczenia, po całych słowach
    const pad = Math.max(0, Math.floor((SENTENCE_MAX - (selEnd - selStart)) / 2))
    let a = Math.max(0, selStart - pad)
    let b = Math.min(sentence.length, selEnd + pad)
    const first = sentence.indexOf(' ', a)
    if (a > 0 && first >= 0 && first < selStart) a = first + 1
    const space = sentence.lastIndexOf(' ', b)
    if (b < sentence.length && space > selEnd) b = space
    sentence = `${a > 0 ? '…' : ''}${sentence.slice(a, b).trim()}${b < sentence.length ? '…' : ''}`
  }
  return sentence.replace(/\s+/g, ' ')
}

export type Rect = { top: number; bottom: number; left: number; right: number }
export type Size = { width: number; height: number }

// pod zaznaczeniem, bo nad nim siedzi systemowe menu kopiowania na telefonie
export function placePopover(
  sel: Rect,
  pop: Size,
  view: Size,
  { gap = 10, margin = 8 }: { gap?: number; margin?: number } = {},
) {
  const center = (sel.left + sel.right) / 2
  const maxLeft = Math.max(margin, view.width - pop.width - margin)
  const left = Math.min(Math.max(center - pop.width / 2, margin), maxLeft)

  const below = sel.bottom + gap
  const roomBelow = view.height - margin - below
  if (pop.height <= roomBelow) return { top: below, left, side: 'below' as const }
  const roomAbove = sel.top - gap - margin
  if (pop.height <= roomAbove) {
    return { top: sel.top - gap - pop.height, left, side: 'above' as const }
  }
  // nie mieści się ani tu, ani tu: tam, gdzie więcej miejsca, i przewijany w środku
  return roomBelow >= roomAbove
    ? { top: below, left, side: 'below' as const, maxHeight: roomBelow }
    : { top: margin, left, side: 'above' as const, maxHeight: roomAbove }
}
