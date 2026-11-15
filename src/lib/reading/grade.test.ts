import { describe, expect, it } from 'vitest'
import type { ReadingSet } from '../../content/schema'
import { gradeReading, itemKey } from './grade'

const set: ReadingSet = {
  id: 'r1',
  type: 'reading-set',
  title: 'Test',
  theme: 'culture',
  texts: [
    {
      genre: 'article',
      paragraphs: [
        { key: 'A', text: 'One. ___ Two.' },
        { key: 'B', text: 'Three.' },
      ],
    },
  ],
  tasks: [
    {
      kind: 'mc',
      items: [
        {
          question: 'Q?',
          options: [{ text: 'a' }, { text: 'b' }, { text: 'c' }],
          answer: 1,
          why_pl: 'x',
        },
      ],
    },
    { kind: 'paragraph-match', items: [{ statement: 'S', answer: 'B', why_pl: 'x' }] },
    {
      kind: 'sentence-insert',
      sentences: [
        { key: 'A', text: 'x' },
        { key: 'B', text: 'y' },
      ],
      answers: [{ answer: 'A', why_pl: 'x' }],
    },
    { kind: 'true-false', items: [{ statement: 'S', answer: false, why_pl: 'x' }] },
    {
      kind: 'gap',
      maxWords: 3,
      items: [{ sentence: 'It was ___.', correct: ['too expensive'], why_pl: 'x' }],
    },
  ],
}

describe('gradeReading', () => {
  it('każdy format i limit słów w luce', () => {
    const answers: Record<string, string> = {
      [itemKey(0, 0)]: '1',
      [itemKey(1, 0)]: 'A',
      [itemKey(2, 0)]: 'A',
      [itemKey(3, 0)]: 'false',
      [itemKey(4, 0)]: 'Too expensive.',
    }
    const r = gradeReading(set, (k) => answers[k] ?? '')
    expect(r.map((x) => x.ok)).toEqual([true, false, true, true, true])
    answers[itemKey(4, 0)] = 'far far too expensive'
    expect(gradeReading(set, (k) => answers[k] ?? '')[4]!.ok).toBe(false)
  })

  it('luka: powód zera, wariant z accepted i luka bez limitu', () => {
    const gap = (maxWords?: number): ReadingSet => ({
      ...set,
      tasks: [
        {
          kind: 'gap',
          ...(maxWords ? { maxWords } : {}),
          items: [
            {
              sentence: 'She used ___.',
              correct: ['white glue'],
              accepted: ['some white glue'],
              why_pl: 'x',
            },
          ],
        },
      ],
      texts: [{ genre: 'article', paragraphs: [{ text: 'x' }] }],
    })
    const one = (s: ReadingSet, v: string) => gradeReading(s, () => v)[0]!
    expect(one(gap(2), 'some white glue')).toMatchObject({ ok: false, reason: 'too-long' })
    expect(one(gap(3), 'some white glue')).toEqual({ key: 't0-0', ok: true })
    expect(one(gap(3), 'glue')).toMatchObject({ ok: false, reason: 'wrong' })
    expect(one(gap(3), '')).toMatchObject({ ok: false, reason: 'empty' })
    // 2026: bez limitu liczy się tylko treść
    expect(one(gap(), 'some white glue').ok).toBe(true)
    expect(one(gap(), 'glue').reason).toBe('wrong')
  })
})
