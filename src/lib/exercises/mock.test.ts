import { describe, expect, it } from 'vitest'
import type { Exercise } from '../../content/schema'
import { buildMock, partsFromIds, total } from './mock'

const steps = [
  { label_pl: 'a', text_pl: 'a' },
  { label_pl: 'b', text_pl: 'b' },
]
const base = { steps, tags: ['past-simple'], difficulty: 2 as const }
const gap = { options: ['a', 'b', 'c', 'd'], answer: 0, steps }

const cloze: Exercise = {
  id: 'c1',
  type: 'choice',
  text: '___ ___ ___ ___ ___ ___',
  gaps: Array(6).fill(gap),
  tags: base.tags,
  difficulty: 2,
}
const wf: Exercise = {
  id: 'w1',
  type: 'word-formation',
  text: '___ ___ ___ ___',
  gaps: Array(4).fill({ base: 'X', correct: ['y'], steps }),
  tags: base.tags,
  difficulty: 2,
}
const kwt = (i: number): Exercise => ({
  ...base,
  id: `k${i}`,
  type: 'key-word-transformation',
  source: 'a',
  keyWord: 'KEY',
  target: 'b ___',
  maxWords: 5,
  correct: ['key'],
})

describe('buildMock', () => {
  it('składa 7 + 8 + 9 = 14 punktów', () => {
    const parts = buildMock([cloze, wf, kwt(1), kwt(2), kwt(3), kwt(4)], () => 0.3)
    expect(parts?.map((p) => p.task)).toEqual([7, 8, 9])
    expect(total(parts!)).toBe(14)
  })
  it('bez materiału na pełny arkusz zwraca null', () => {
    expect(buildMock([cloze, kwt(1)], () => 0.3)).toBeNull()
  })
  it('gotowy zestaw z id układa po typie', () => {
    const parts = partsFromIds(['k1', 'w1', 'c1'], [cloze, wf, kwt(1)])
    expect(parts.map((p) => p.task)).toEqual([7, 8, 9])
  })
})
