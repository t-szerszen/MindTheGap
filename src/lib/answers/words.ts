import { normalizeAnswer, normalizeBasic } from '.'

// liczenie wyrazów: jedna funkcja dla wypracowań i dla luk z limitem słów.
// Jak w zasadach CKE: wyraz to to, co oddzielają spacje — skrót (wasn't), wyraz z łącznikiem, Peter's,
// data 10.01.2024, adres www i e-mail to po JEDNYM wyrazie. Sama interpunkcja (np. samotny myślnik) się nie liczy.
const HAS_WORD = /[\p{L}\p{N}]/u

export function countWords(text: string) {
  return text.split(/\s+/).filter((t) => HAS_WORD.test(t)).length
}

export type LimitCheck =
  { ok: true } | { ok: false; reason: 'empty' | 'key-missing' | 'too-long' | 'wrong' }

// luka z limitem wyrazów (i czasem ze słowem kluczem): najpierw to, co da się sprawdzić bez klucza,
// żeby podpowiedź mówiła, co poszło nie tak (brak słowa kluczowego, za dużo słów)
export function checkLimited(
  input: string,
  opts: { answers: string[]; maxWords?: number; keyWord?: string },
): LimitCheck {
  const n = normalizeBasic(input)
  if (!n) return { ok: false, reason: 'empty' }
  if (opts.keyWord) {
    const words = n.split(' ')
    const key = normalizeBasic(opts.keyWord).split(' ')
    const hasKey = words.some((_, i) => key.every((k, j) => words[i + j] === k))
    if (!hasKey) return { ok: false, reason: 'key-missing' }
  }
  if (opts.maxWords && countWords(input) > opts.maxWords) return { ok: false, reason: 'too-long' }
  const v = normalizeAnswer(input)
  return opts.answers.some((a) => normalizeAnswer(a) === v)
    ? { ok: true }
    : { ok: false, reason: 'wrong' }
}
