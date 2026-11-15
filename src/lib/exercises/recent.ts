import type { Exercise } from '../../content/schema'
import { splitBlanks } from './gap'

export type RecentGap = {
  before: string
  given: string
  after: string
  expected: string
  // słowotwórstwo: wyraz z nawiasu, bo bez niego zdanie nic nie mówi
  cue?: string
}

// ile znaków kontekstu z każdej strony luki w długim tekście
const CONTEXT = 60

// zdanie z odpowiedzią ucznia w luce, do szybkiego przeglądu na stronie startowej.
// null = nie da się odtworzyć (stara próba bez zapisanej odpowiedzi albo zmieniona treść)
export function recentGap(ex: Exercise, key: string, answer: string): RecentGap | null {
  const given = answer.trim()
  if (!given) return null
  switch (ex.type) {
    case 'gap-fill': {
      const m = /___ \(([^()]+)\)/.exec(ex.sentence)
      if (!m) return null
      return {
        before: ex.sentence.slice(0, m.index).trimEnd(),
        given,
        after: ex.sentence.slice(m.index + m[0].length).trimStart(),
        expected: ex.correct[0]!,
      }
    }
    case 'key-word-transformation': {
      const [before = '', after = ''] = splitBlanks(ex.target)
      return { before: before.trimEnd(), given, after: after.trimStart(), expected: ex.correct[0]! }
    }
    case 'choice': {
      const i = gapIndex(key)
      const gap = ex.gaps[i]
      const option = gap?.options[Number(given)]
      if (!gap || option === undefined) return null
      return { ...around(ex.text, i), given: option, expected: gap.options[gap.answer]! }
    }
    case 'word-formation': {
      const i = gapIndex(key)
      const gap = ex.gaps[i]
      if (!gap) return null
      return { ...around(ex.text, i), given, expected: gap.correct[0]!, cue: gap.base }
    }
  }
}

const gapIndex = (key: string) => Number(key.split('#')[1] ?? 1) - 1

// tylko zdanie z tą luką; inne luki w tym samym zdaniu zostają jako ___
function around(text: string, i: number) {
  const parts = splitBlanks(text)
  const left = parts.slice(0, i + 1).join('___')
  const right = parts.slice(i + 1).join('___')
  const start = Math.max(left.lastIndexOf('. '), left.lastIndexOf('! '), left.lastIndexOf('? '))
  let before = start >= 0 ? left.slice(start + 2) : left
  const end = right.search(/[.!?](\s|$)/)
  let after = end >= 0 ? right.slice(0, end + 1) : right
  before = before.trimEnd()
  after = after.trimStart()
  if (before.length > CONTEXT)
    before = '…' + before.slice(before.indexOf(' ', before.length - CONTEXT) + 1)
  if (after.length > CONTEXT) after = after.slice(0, after.lastIndexOf(' ', CONTEXT)) + '…'
  return { before, after }
}
