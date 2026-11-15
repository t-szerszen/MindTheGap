import { normalizeAnswer, normalizeBasic } from '.'

// liczenie wyrazów: jedna funkcja dla wypracowań i dla luk z limitem słów.
// Wyraz = ciąg liter/cyfr (z apostrofami i łącznikami w środku), interpunkcja się nie liczy.
const WORD = /[\p{L}\p{N}]+(?:['’‐-][\p{L}\p{N}]+)*/gu

export function countWords(text: string) {
  return text.match(WORD)?.length ?? 0
}

// w lukach skrót (don't, I'm) liczy się jak dwa wyrazy, bo tyle ma pełna forma
export function countAnswerWords(answer: string) {
  return countWords(normalizeBasic(answer))
}

export type TransformCheck =
  { ok: true } | { ok: false; reason: 'empty' | 'key-missing' | 'too-long' | 'wrong' }

// transformacja z wyrazem kluczowym: najpierw rzeczy, które da się sprawdzić bez klucza,
// żeby podpowiedź mówiła, co poszło nie tak (brak słowa kluczowego, za dużo słów)
export function checkTransformation(
  input: string,
  opts: { answers: string[]; keyWord: string; maxWords: number },
): TransformCheck {
  const n = normalizeBasic(input)
  if (!n) return { ok: false, reason: 'empty' }
  const key = normalizeBasic(opts.keyWord)
  const words = n.split(' ')
  const keyWords = key.split(' ')
  const hasKey = words.some((_, i) => keyWords.every((k, j) => words[i + j] === k))
  if (!hasKey) return { ok: false, reason: 'key-missing' }
  if (countAnswerWords(input) > opts.maxWords) return { ok: false, reason: 'too-long' }
  const v = normalizeAnswer(input)
  return opts.answers.some((a) => normalizeAnswer(a) === v)
    ? { ok: true }
    : { ok: false, reason: 'wrong' }
}
