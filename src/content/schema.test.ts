import { describe, expect, it } from 'vitest'
import {
  blockSchema,
  gapFillSchema,
  grammarTopicSchema,
  readingSetSchema,
  timelineMarkSchema,
} from './schema'

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

// malutkie zestawy na każde zadanie z arkusza, tylko do testów
const para = (key: string, text: string) => ({ key, text })
const task4 = {
  id: 'r4',
  type: 'reading-set',
  examTask: 4,
  title: 'Test 4',
  theme: 'science',
  texts: [
    {
      genre: 'article',
      paragraphs: [para('A', 'One.'), para('B', 'Two.'), para('C', 'Three.'), para('D', 'Four.')],
    },
  ],
  tasks: [
    {
      kind: 'paragraph-match',
      items: ['A', 'B', 'C', 'D', 'B'].map((answer) => ({ statement: 'S', answer, why_pl: 'x' })),
    },
  ],
}
const task5 = {
  id: 'r5',
  type: 'reading-set',
  examTask: 5,
  title: 'Test 5',
  theme: 'nature',
  texts: [
    {
      genre: 'report',
      paragraphs: [{ text: 'One ___ two ___ three.' }, { text: 'Four ___ five ___ six ___.' }],
    },
  ],
  tasks: [
    {
      kind: 'sentence-insert',
      sentences: ['A', 'B', 'C', 'D', 'E', 'F'].map((key) => ({ key, text: `Sentence ${key}.` })),
      answers: ['C', 'A', 'F', 'B', 'E'].map((answer) => ({ answer, why_pl: 'x' })),
    },
  ],
}
const mc = (answer: number) => ({
  question: 'Q?',
  options: [0, 1, 2, 3].map((j) =>
    j === answer ? { text: `o${j}` } : { text: `o${j}`, wrong_pl: 'bo nie' },
  ),
  answer,
  why_pl: 'x',
})
const gapItem = (correct: string[], heading?: string): Record<string, unknown> => ({
  ...(heading ? { heading } : {}),
  sentence: 'It was ___.',
  correct,
  why_pl: 'x',
})
const task6 = {
  id: 'r6',
  type: 'reading-set',
  examTask: 6,
  title: 'Test 6',
  theme: 'culture',
  texts: [
    { title: 'Text 1', genre: 'novel', paragraphs: [{ text: 'Once.' }] },
    { title: 'Text 2', genre: 'article', paragraphs: [{ text: 'Now.' }] },
  ],
  tasks: [
    { kind: 'mc', text: 1, items: [mc(0), mc(1), mc(2), mc(3)] },
    {
      kind: 'gap',
      text: 2,
      maxWords: 6,
      layout: 'note',
      items: [
        gapItem(['cheap'], 'Pros'),
        gapItem(['fast'], 'Pros'),
        gapItem(['too loud'], 'Cons'),
        gapItem(['far away'], 'Cons'),
      ],
    },
  ],
}

describe('readingSetSchema', () => {
  it('przepuszcza zestawy do zad. 4, 5 i 6', () => {
    for (const s of [task4, task5, task6])
      expect(readingSetSchema.safeParse(s).error).toBeUndefined()
  })

  it('odrzuca odpowiedź mc poza opcjami i odwołanie do trzeciego tekstu', () => {
    const bad = { ...mc(0), options: mc(0).options.slice(0, 3), answer: 3 }
    expect(
      readingSetSchema.safeParse({
        ...task6,
        examTask: undefined,
        tasks: [{ kind: 'mc', items: [bad] }],
      }).success,
    ).toBe(false)
    expect(
      readingSetSchema.safeParse({
        ...task4,
        examTask: undefined,
        tasks: [{ kind: 'mc', text: 2, items: [mc(0)] }],
      }).success,
    ).toBe(false)
  })

  const errors = (s: unknown) =>
    readingSetSchema.safeParse(s).error?.issues.map((x) => x.message) ?? []

  it('zad. 4: każdy akapit użyty i dokładnie jeden dwa razy', () => {
    const items = (answers: string[]) => [
      {
        kind: 'paragraph-match',
        items: answers.map((answer) => ({ statement: 'S', answer, why_pl: 'x' })),
      },
    ]
    expect(errors({ ...task4, tasks: items(['A', 'B', 'C', 'A', 'B']) }).join()).toMatch(
      /każdy akapit/,
    )
    expect(errors({ ...task4, tasks: items(['A', 'B', 'C', 'D']) }).join()).toMatch(/5 zdań/)
    const three = { ...task4.texts[0]!, paragraphs: task4.texts[0]!.paragraphs.slice(0, 3) }
    expect(errors({ ...task4, texts: [three] }).join()).toMatch(/4 akapity/)
  })

  it('zad. 5: 6 zdań, 5 luk, bez powtórek', () => {
    const t = task5.tasks[0]!
    const twice = {
      ...t,
      answers: ['C', 'A', 'C', 'B', 'E'].map((answer) => ({ answer, why_pl: 'x' })),
    }
    expect(errors({ ...task5, tasks: [twice] }).join()).toMatch(/dwóch lukach/)
    const seven = { ...t, sentences: [...t.sentences, { key: 'G', text: 'G.' }] }
    expect(errors({ ...task5, tasks: [seven] }).join()).toMatch(/6 zdań/)
  })

  it('zad. 6: dwa teksty, jeden literacki, 4 opcje i uwaga przy każdym dystraktorze', () => {
    const [lit, art] = task6.texts
    expect(errors({ ...task6, texts: [art, art] }).join()).toMatch(/literacki/)
    const [m, g] = task6.tasks as [(typeof task6.tasks)[0], (typeof task6.tasks)[1]]
    const three = { ...mc(0), options: mc(0).options.slice(0, 3) }
    expect(
      errors({ ...task6, tasks: [{ ...m, items: [three, mc(1), mc(2), mc(3)] }, g] }).join(),
    ).toMatch(/4 opcje/)
    const bare = { ...mc(0), options: mc(0).options.map((o) => ({ text: o.text })) }
    expect(
      errors({ ...task6, tasks: [{ ...m, items: [bare, mc(1), mc(2), mc(3)] }, g] }).join(),
    ).toMatch(/wrong_pl/)
    expect(errors({ ...task6, tasks: [g, m] }).join()).toMatch(/najpierw mc/)
    expect(lit!.genre).toBe('novel')
  })

  it('luki: klucz w limicie, bez powtórzonych wariantów, notatka z nagłówkami', () => {
    const m = task6.tasks[0]
    const gapTask = (
      extra: object,
      items = [gapItem(['a']), gapItem(['b']), gapItem(['c']), gapItem(['d'])],
    ) => ({
      ...task6,
      tasks: [m, { kind: 'gap', text: 2, items, ...extra }],
    })
    expect(errors(gapTask({}))).toEqual([])
    // 2026: bez limitu wyrazów
    expect(
      errors(
        gapTask({}, [
          gapItem(['a very long answer with eight words in it']),
          gapItem(['b']),
          gapItem(['c']),
          gapItem(['d']),
        ]),
      ),
    ).toEqual([])
    expect(
      errors(
        gapTask({ maxWords: 2 }, [
          gapItem(['far too long']),
          gapItem(['b']),
          gapItem(['c']),
          gapItem(['d']),
        ]),
      ).join(),
    ).toMatch(/więcej niż 2/)
    expect(
      errors(
        gapTask({}, [
          { ...gapItem(['a']), accepted: ['A.'] },
          gapItem(['b']),
          gapItem(['c']),
          gapItem(['d']),
        ]),
      ).join(),
    ).toMatch(/dwa razy/)
    expect(errors(gapTask({ layout: 'note' })).join()).toMatch(/heading/)
    expect(
      errors(
        gapTask({}, [
          { ...gapItem(['a']), sentence: 'No gap.' },
          gapItem(['b']),
          gapItem(['c']),
          gapItem(['d']),
        ]),
      ).join(),
    ).toMatch(/jedna ___/)
  })
})
