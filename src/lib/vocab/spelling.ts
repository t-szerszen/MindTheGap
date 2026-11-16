import { normalizeText } from './index'

export type Spelling = 'ok' | 'close' | 'wrong'

// bez ogonków, żeby „zrodlo” było literówką, a nie zupełnie innym słowem
function plain(s: string) {
  return s.normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l')
}

export function distance(a: string, b: string) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost)
    }
    prev = cur
  }
  return prev[b.length]!
}

// na odwrocie bywa kilka znaczeń po przecinku, wystarczy trafić jedno
export function answerVariants(answer: string) {
  const all = normalizeText(answer)
  const parts = answer.split(/[,;/]/).map(normalizeText).filter(Boolean)
  return [...new Set([all, ...parts])]
}

export function checkSpelling(input: string, answer: string): Spelling {
  const typed = normalizeText(input)
  if (!typed) return 'wrong'
  const variants = answerVariants(answer)
  if (variants.includes(typed)) return 'ok'
  // krótkie słowo: jedna literka różnicy, dłuższe: dwie
  const close = variants.some((v) => {
    const limit = v.length <= 5 ? 1 : 2
    return distance(plain(typed), plain(v)) <= limit
  })
  return close ? 'close' : 'wrong'
}
