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

export function normalizeAnswer(input: string) {
  let s = input
    .toLowerCase()
    .replace(/[’‘`´ʼ]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?,;:]+$/, '')
    .trim()
  for (const [re, full] of CONTRACTIONS) s = s.replace(re, full)
  return s.replace(/\s+/g, ' ').trim()
}

export function isCorrect(input: string, answers: string[]) {
  const n = normalizeAnswer(input)
  return n.length > 0 && answers.some((a) => normalizeAnswer(a) === n)
}
