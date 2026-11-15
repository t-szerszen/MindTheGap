import { describe, expect, it } from 'vitest'
import type {
  Exercise,
  FormSet,
  GapFillExercise,
  GrammarTopic,
  Tense,
  Topic,
} from '../../content/schema'
import { checkContent } from './check'

const f = { pattern: [{ text: 'x', role: 'neutral' as const }], example: { en: 'x', pl: 'x' } }
const forms: FormSet = { affirmative: f, negative: f, question: f, whQuestion: f }

function tense(id: string, order: number, related: string[] = []): Tense {
  return {
    id,
    order,
    nameEn: id === 'present-perfect' ? 'Present Perfect' : 'Past Simple',
    group: 'present',
    aspect: 'perfect',
    oneLiner_pl: 'x',
    timeline: { now: 0.5, marks: [{ kind: 'point', from: 0.2, label: 'x' }] },
    howToChoose: [
      { step_pl: 'a', text_pl: 'a' },
      { step_pl: 'b', text_pl: 'b' },
      { step_pl: 'c', text_pl: 'c' },
    ],
    forms: { active: forms, passive: forms },
    uses: [{ title_pl: 'x', explanation_pl: 'x', examples: [{ en: 'x', pl: 'x' }] }],
    signalWords: [{ word: 'since' }],
    relatedTenses: related.map((r) => ({ id: r, relation_pl: 'x' })),
    commonMistakes: [],
    maturaTips_pl: [],
  }
}

function exercise(id: string, sentence: string, tags: string[]): GapFillExercise {
  return {
    id,
    type: 'gap-fill',
    sentence,
    correct: ['x'],
    steps: [
      { label_pl: 'a', text_pl: 'a' },
      { label_pl: 'b', text_pl: 'b' },
    ],
    tags,
    difficulty: 1,
  }
}

const base = {
  tenses: [tense('present-perfect', 3, ['past-simple']), tense('past-simple', 5)],
  topics: [],
  phraseSets: [],
  exercises: [exercise('e1', 'I ___ (see) it yesterday.', ['past-simple'])],
}

describe('checkContent', () => {
  it('poprawny zestaw nie ma błędów', () => {
    expect(checkContent(base)).toEqual([])
  })

  it('łapie brakujące powiązane czasy i złe tagi', () => {
    const errors = checkContent({
      ...base,
      tenses: [tense('present-perfect', 3, ['past-perfect'])],
      exercises: [exercise('e1', 'I ___ (see) it.', ['conditionals'])],
    })
    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain('past-perfect')
    expect(errors[1]).toContain('conditionals')
  })

  it('łapie powtórzone id i order', () => {
    const errors = checkContent({
      ...base,
      tenses: [tense('past-simple', 5), tense('past-simple', 5)],
    })
    expect(errors.some((e) => e.includes('powtórzone id czasu'))).toBe(true)
    expect(errors.some((e) => e.includes('order'))).toBe(true)
  })

  it('zdanie z nazwą czasu to podpowiedź', () => {
    const errors = checkContent({
      ...base,
      exercises: [exercise('e1', 'Use the Past Simple: I ___ (see) it.', ['past-simple'])],
    })
    expect(errors[0]).toContain('podpowiada')
  })

  it('to samo zdanie w dwóch zadaniach', () => {
    const errors = checkContent({
      ...base,
      exercises: [
        exercise('e1', 'I ___ (see) it yesterday.', ['past-simple']),
        exercise('e2', 'I ___ (see) it yesterday!', ['past-simple']),
      ],
    })
    expect(errors[0]).toContain('to samo zdanie')
  })
})

describe('checkContent: odpowiedzi', () => {
  it('skrót obok pełnej formy to duplikat', () => {
    const e = exercise('e1', 'I ___ (close) it.', ['past-simple'])
    const errors = checkContent({
      ...base,
      exercises: [{ ...e, correct: ['will close'], accepted: ["'ll close"] }],
    })
    expect(errors[0]).toContain('powtarza się')
  })
})

const steps = [
  { label_pl: 'a', text_pl: 'a' },
  { label_pl: 'b', text_pl: 'b' },
]

describe('checkContent: typy zadań', () => {
  it('transformacja: słowo klucz i limit wyrazów w kluczu', () => {
    const kwt: Exercise = {
      id: 'k1',
      type: 'key-word-transformation',
      source: 'People say he is rich.',
      keyWord: 'SAID',
      target: 'He ___ rich.',
      maxWords: 5,
      correct: ['is said to be', 'is believed to be', 'is widely said to be very'],
      steps,
      tags: ['past-simple'],
      difficulty: 2,
    }
    const errors = checkContent({ ...base, exercises: [kwt] })
    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain('SAID')
    expect(errors[1]).toContain('więcej niż 5')
  })

  it('słowotwórstwo: jeden wyraz i nie sam wyraz bazowy', () => {
    const wf: Exercise = {
      id: 'w1',
      type: 'word-formation',
      text: 'It was a ___ decision and a ___ one.',
      gaps: [
        { base: 'WISE', correct: ['wise'], steps },
        { base: 'CARE', correct: ['very careful'], steps },
      ],
      tags: ['past-simple'],
      difficulty: 1,
    }
    const errors = checkContent({ ...base, exercises: [wf] })
    expect(errors.some((e) => e.includes('jeden wyraz'))).toBe(true)
    expect(errors.some((e) => e.includes('wyraz bazowy'))).toBe(true)
  })
})

describe('checkContent: gramatyka', () => {
  const topic: Topic = {
    id: 'conditionals',
    category: 'grammar',
    title_pl: 'x',
    summary_pl: 'x',
    blocks: [{ type: 'text', md_pl: 'x' }],
  }
  const sub = {
    id: 'a',
    label: 'a',
    name: 'a',
    desc_pl: 'a',
    time_pl: 'a',
    scale: {
      left: 'a',
      right: 'b',
      ticks: ['1', '2', '3', '4'] as [string, string, string, string],
      on: [0],
      ring: 0,
    },
    formula: [{ key: '+', text: '[v:V1]' }],
    usage_pl: ['x'],
    signals: ['if'],
    examples: [{ en: 'x', pl: 'x' }],
    steps: ['a', 'b', 'c'] as [string, string, string],
  }
  const g: GrammarTopic = {
    id: 'cond',
    title_pl: 'x',
    note_pl: 'x',
    chooseTitle_pl: 'x',
    defaultSubtype: 'a',
    practiceTag: 'conditionals',
    theoryTopic: 'conditionals',
    subtypes: [sub, { ...sub, id: 'b' }],
  }

  it('poprawny indeks bez błędów', () => {
    const errors = checkContent({
      ...base,
      topics: [topic],
      grammar: [g],
      grammarTabs: [
        { id: 'cond', group: 'sentences', tab: ['a', 'b'], label_pl: 'x', desc_pl: 'x' },
        {
          id: 'wish',
          group: 'sentences',
          tab: ['a', 'b'],
          label_pl: 'x',
          desc_pl: 'x',
          topic: 'conditionals',
        },
      ],
    })
    expect(errors).toEqual([])
  })

  it('łapie brak przekładki, zły tag i brakujący temat', () => {
    const errors = checkContent({
      ...base,
      topics: [topic],
      grammar: [{ ...g, practiceTag: 'nope', theoryTopic: 'nope' }],
      grammarTabs: [
        { id: 'x', group: 'words', tab: ['a', 'b'], label_pl: 'x', desc_pl: 'x', topic: 'nope' },
      ],
    })
    expect(errors).toHaveLength(4)
  })
})
