import { describe, expect, it } from 'vitest'
import { blockSchema, gapFillSchema, grammarTopicSchema, timelineMarkSchema } from './schema'

const gap = {
  id: 'pp-1',
  type: 'gap-fill',
  sentence: 'She ___ (live) in Gdańsk since 2019.',
  correct: ['has lived'],
  steps: [
    { label_pl: 'sygnał', text_pl: 'since 2019' },
    { label_pl: 'forma', text_pl: 'has + V3' },
  ],
  tags: ['present-perfect'],
  difficulty: 1,
}

describe('gapFillSchema', () => {
  it('przepuszcza poprawne ćwiczenie', () => {
    expect(gapFillSchema.safeParse(gap).success).toBe(true)
  })

  it('odrzuca zdanie bez luki i z dwiema lukami', () => {
    expect(gapFillSchema.safeParse({ ...gap, sentence: 'She lives here.' }).success).toBe(false)
    expect(
      gapFillSchema.safeParse({ ...gap, sentence: 'She ___ (live) here and ___ (work).' }).success,
    ).toBe(false)
  })

  it('odrzuca nieznane pola i złe poziomy trudności', () => {
    expect(gapFillSchema.safeParse({ ...gap, hint: 'Present Perfect' }).success).toBe(false)
    expect(gapFillSchema.safeParse({ ...gap, difficulty: 4 }).success).toBe(false)
  })

  it('odrzuca teksty ze spacjami na brzegach i id nie w kebab-case', () => {
    expect(gapFillSchema.safeParse({ ...gap, correct: [' has lived'] }).success).toBe(false)
    expect(gapFillSchema.safeParse({ ...gap, id: 'PP_1' }).success).toBe(false)
  })
})

describe('timelineMarkSchema', () => {
  it('span i repeat potrzebują "to" za "from"', () => {
    expect(timelineMarkSchema.safeParse({ kind: 'span', from: 0.2, label: 'x' }).success).toBe(
      false,
    )
    expect(
      timelineMarkSchema.safeParse({ kind: 'span', from: 0.2, to: 0.1, label: 'x' }).success,
    ).toBe(false)
    expect(
      timelineMarkSchema.safeParse({ kind: 'repeat', from: 0.1, to: 0.9, label: 'x' }).success,
    ).toBe(true)
  })

  it('pozycje tylko w zakresie 0..1', () => {
    expect(timelineMarkSchema.safeParse({ kind: 'point', from: 1.2, label: 'x' }).success).toBe(
      false,
    )
  })
})

describe('blockSchema', () => {
  it('tabela musi mieć równe wiersze', () => {
    const table = { type: 'table', headers: ['a', 'b'], rows: [['1', '2']] }
    expect(blockSchema.safeParse(table).success).toBe(true)
    expect(blockSchema.safeParse({ ...table, rows: [['1']] }).success).toBe(false)
  })

  it('nieznany typ bloku nie przechodzi', () => {
    expect(blockSchema.safeParse({ type: 'video', url: 'x' }).success).toBe(false)
  })
})

describe('grammarTopicSchema', () => {
  const sub = (id: string) => ({
    id,
    label: id,
    name: 'First conditional',
    desc_pl: 'realna sytuacja',
    time_pl: 'przyszłość',
    scale: { left: 'realne', right: 'nierealne', ticks: ['a', 'b', 'c', 'd'], on: [1], ring: 1 },
    formula: [{ key: 'warunek', text: '[k:If] + [v:Present Simple]' }],
    usage_pl: ['ostrzeżenia — [k:unless]'],
    signals: ['if'],
    examples: [{ en: '[k:If] it [v:rains], we [a:will] [v:stay].', pl: 'Jeśli będzie padać…' }],
    steps: ['a', 'b', '[k:If] + [v:Present Simple]'],
  })
  const topic = {
    id: 'conditionals',
    title_pl: 'Tryby warunkowe',
    note_pl: 'x',
    chooseTitle_pl: 'Jak wybrać tryb?',
    defaultSubtype: '1',
    practiceTag: 'conditionals',
    theoryTopic: 'conditionals',
    subtypes: [sub('0'), sub('1')],
    cheat: {
      title_pl: 'Ściąga',
      headers: ['typ', 'warunek', 'skutek'],
      rows: [
        ['0', '[k:If] + Present S.', 'Present S.'],
        ['1', '[k:If] + Present S.', '[a:will] + [v:V1]'],
      ],
    },
  }

  it('przepuszcza poprawny temat', () => {
    expect(grammarTopicSchema.safeParse(topic).success).toBe(true)
  })

  it('odrzuca złą notację, brakujący podtyp i obcy wiersz ściągi', () => {
    const bad = { ...sub('1'), usage_pl: ['[x:if]'] }
    expect(grammarTopicSchema.safeParse({ ...topic, subtypes: [sub('0'), bad] }).success).toBe(
      false,
    )
    expect(grammarTopicSchema.safeParse({ ...topic, defaultSubtype: '3' }).success).toBe(false)
    const rows = [...topic.cheat.rows, ['mix', 'a', 'b']]
    expect(
      grammarTopicSchema.safeParse({ ...topic, cheat: { ...topic.cheat, rows } }).success,
    ).toBe(false)
  })

  it('skala ma cztery punkty, a pierścień tylko na jednym z nich', () => {
    const s = sub('1')
    const three = { ...s, scale: { ...s.scale, ticks: ['a', 'b', 'c'] } }
    const ring = { ...s, scale: { ...s.scale, ring: 4 } }
    for (const x of [three, ring])
      expect(grammarTopicSchema.safeParse({ ...topic, subtypes: [sub('0'), x] }).success).toBe(
        false,
      )
  })
})
