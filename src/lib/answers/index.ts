import { toBritish } from './variants'

// sprawdzanie odpowiedzi w lukach: wielkość liter, apostrofy i skróty nie mają znaczenia

const CONTRACTIONS: [RegExp, string][] = [
  [/\bwon't\b/g, 'will not'],
  [/\bshan't\b/g, 'shall not'],
  [/\bcan't\b/g, 'can not'],
  [/\bcannot\b/g, 'can not'],
  [/n't\b/g, ' not'],
  [/'ve\b/g, ' have'],
  [/'ll\b/g, ' will'],
  [/'re\b/g, ' are'],
  [/'m\b/g, ' am'],
]
// 's i 'd zostają jak są: to może być is/has albo had/would, więc takie warianty idą do "accepted"

// bez wyrównywania pisowni: tego używa walidator, żeby amerykańskie warianty w "accepted" nie były duplikatami
export function normalizeBasic(input: string) {
  let s = input
    .toLowerCase()
    .replace(/[’‘`´ʼ]/g, "'")
    .replace(/[‐‑–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?,;:]+$/, '')
    .trim()
  for (const [re, full] of CONTRACTIONS) s = s.replace(re, full)
  return s.replace(/\s+/g, ' ').trim()
}

export function normalizeAnswer(input: string) {
  return toBritish(normalizeBasic(input))
}

export function isCorrect(input: string, answers: string[]) {
  const n = normalizeAnswer(input)
  return n.length > 0 && answers.some((a) => normalizeAnswer(a) === n)
}
