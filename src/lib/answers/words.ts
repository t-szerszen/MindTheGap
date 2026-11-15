import { normalizeAnswer, normalizeBasic } from '.'

// liczenie wyrazów: jedna funkcja dla wypracowań i dla luk z limitem słów.
// Wyraz = ciąg liter/cyfr (z apostrofami i łącznikami w środku), interpunkcja się nie liczy.
// Jak w zasadach CKE: skrót (wasn't, must've), wyraz z łącznikiem i Peter's to JEDEN wyraz.
const WORD = /[\p{L}\p{N}]+(?:['’‐-][\p{L}\p{N}]+)*/gu

export function countWords(text: string) {
  return text.match(WORD)?.length ?? 0
}

export type LimitCheck =
  { ok: true } | { ok: false; reason: 'empty' | 'key-missing' | 'too-long' | 'wrong' }

// luka z limitem wyrazów (i czasem ze słowem kluczem): najpierw to, co da się sprawdzić bez klucza,
// żeby podpowiedź mówiła, co poszło nie tak (brak słowa kluczowego, za dużo słów)
export function checkLimited(
  input: string,
  opts: { answers: string[]; maxWords: number; keyWord?: string },
): LimitCheck {
  const n = normalizeBasic(input)
  if (!n) return { ok: false, reason: 'empty' }
  if (opts.keyWord) {
    const words = n.split(' ')
    const key = normalizeBasic(opts.keyWord).split(' ')
    const hasKey = words.some((_, i) => key.every((k, j) => words[i + j] === k))
    if (!hasKey) return { ok: false, reason: 'key-missing' }
  }
  if (countWords(input) > opts.maxWords) return { ok: false, reason: 'too-long' }
  const v = normalizeAnswer(input)
  return opts.answers.some((a) => normalizeAnswer(a) === v)
    ? { ok: true }
    : { ok: false, reason: 'wrong' }
}
