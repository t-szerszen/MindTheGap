import { z } from 'zod'
import { countBlanks, countGaps } from '../lib/exercises/gap'
import { markedError } from '../lib/text/marked'

// jedno źródło prawdy dla treści: typy w aplikacji to z.infer z tych schematów

const txt = z
  .string()
  .min(1)
  .refine((s) => s === s.trim(), 'bez spacji na początku i na końcu')
const id = z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'id w kebab-case, np. present-perfect')
const pos = z.number().min(0).max(1)

export const roleSchema = z.enum([
  'subject',
  'aux',
  'verb',
  'signal',
  'particle',
  'object',
  'neutral',
])

export const formulaPartSchema = z.strictObject({ text: txt, role: roleSchema })
const partsSchema = z.array(formulaPartSchema).min(1)

export const exSchema = z.strictObject({ en: txt, pl: txt })

export const formulaSchema = z.strictObject({
  pattern: partsSchema,
  example: exSchema,
  note_pl: txt.optional(),
})

export const formSetSchema = z.strictObject({
  affirmative: formulaSchema,
  negative: formulaSchema,
  question: formulaSchema,
  whQuestion: formulaSchema,
})

export const timelineMarkSchema = z
  .strictObject({
    kind: z.enum(['point', 'span', 'repeat', 'arrow-to-now']),
    from: pos,
    to: pos.optional(),
    label: txt,
  })
  .superRefine((m, ctx) => {
    const needsTo = m.kind === 'span' || m.kind === 'repeat'
    if (needsTo && (m.to === undefined || m.to <= m.from))
      ctx.addIssue({ code: 'custom', message: `${m.kind} potrzebuje "to" większego niż "from"` })
    if (!needsTo && m.to !== undefined)
      ctx.addIssue({ code: 'custom', message: `${m.kind} nie używa pola "to"` })
  })

const stepSchema = z.strictObject({ step_pl: txt, text_pl: txt })

export const tenseSchema = z
  .strictObject({
    id,
    order: z.number().int().positive(),
    nameEn: txt,
    group: z.enum(['present', 'past', 'future']),
    aspect: z.enum(['simple', 'continuous', 'perfect', 'perfect-continuous']),
    // dodatkowe: dwie krótkie linijki na przekładkę w indeksie, np. ["going", "to"]
    tabLabel: z.tuple([txt, txt]).optional(),
    oneLiner_pl: txt,
    timeline: z.strictObject({
      now: pos.default(0.5),
      marks: z.array(timelineMarkSchema).min(1),
    }),
    howToChoose: z.array(stepSchema).min(3).max(5),
    forms: z
      .strictObject({
        active: formSetSchema,
        passive: formSetSchema.nullable(),
        passiveNote_pl: txt.optional(),
      })
      .refine(
        (f) => f.passive !== null || f.passiveNote_pl !== undefined,
        'bez strony biernej trzeba wyjaśnić to w passiveNote_pl',
      ),
    modals: z
      .array(
        z.strictObject({
          modal: txt,
          pattern: partsSchema,
          example: exSchema,
          note_pl: txt.optional(),
        }),
      )
      .min(1)
      .optional(),
    uses: z
      .array(
        z.strictObject({
          title_pl: txt,
          explanation_pl: txt,
          examples: z.array(exSchema).min(1),
        }),
      )
      .min(1),
    signalWords: z.array(z.strictObject({ word: txt, note_pl: txt.optional() })).min(1),
    relatedTenses: z.array(
      z.strictObject({ id, relation_pl: txt, contrast: z.array(exSchema).min(1).optional() }),
    ),
    commonMistakes: z.array(z.strictObject({ wrong: txt, right: txt, why_pl: txt })),
    maturaTips_pl: z.array(txt),
  })
  .superRefine((t, ctx) => {
    for (const m of t.timeline.marks) {
      if (m.kind === 'arrow-to-now' && m.from >= t.timeline.now)
        ctx.addIssue({ code: 'custom', message: 'arrow-to-now musi zaczynać się przed "now"' })
    }
    const rel = t.relatedTenses.map((r) => r.id)
    if (rel.includes(t.id))
      ctx.addIssue({ code: 'custom', message: 'czas nie może wskazywać sam na siebie' })
    if (new Set(rel).size !== rel.length)
      ctx.addIssue({ code: 'custom', message: 'powtórzony czas w relatedTenses' })
  })

export const blockSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('text'), md_pl: txt }),
  z
    .strictObject({
      type: z.literal('table'),
      headers: z.array(txt).min(1),
      rows: z.array(z.array(z.string())).min(1),
    })
    .refine(
      (b) => b.rows.every((r) => r.length === b.headers.length),
      'każdy wiersz tabeli musi mieć tyle komórek, ile nagłówków',
    ),
  z.strictObject({ type: z.literal('examples'), items: z.array(exSchema).min(1) }),
  z.strictObject({
    type: z.literal('callout'),
    variant: z.enum(['tip', 'warning', 'matura']),
    md_pl: txt,
  }),
  z.strictObject({ type: z.literal('formula'), parts: partsSchema, example: exSchema.optional() }),
  z.strictObject({ type: z.literal('steps'), items: z.array(stepSchema).min(1) }),
  z.strictObject({
    type: z.literal('timeline'),
    now: pos.default(0.5),
    marks: z.array(timelineMarkSchema).min(1),
    caption_pl: txt.optional(),
  }),
  // dwie (czasem trzy) kolumny obok siebie: to samo w dwóch strukturach i różnica znaczenia
  z.strictObject({
    type: z.literal('comparison'),
    columns: z
      .array(
        z.strictObject({
          title: txt,
          md_pl: txt,
          examples: z.array(exSchema).optional(),
        }),
      )
      .min(2)
      .max(3),
    takeaway_pl: txt.optional(),
  }),
])

export const topicSchema = z.strictObject({
  id,
  category: z.enum([
    'tenses',
    'grammar',
    'modals',
    'prepositions',
    'phrasal-verbs',
    'vocabulary',
    'writing',
    'exam',
    'other',
  ]),
  title_pl: txt,
  summary_pl: txt,
  blocks: z.array(blockSchema).min(1),
})

export const phraseSetSchema = z.strictObject({
  id,
  category: z.enum([
    'idioms',
    'linkers',
    'essay-phrases',
    'article-phrases',
    'letter-phrases',
    'collocations',
    'phrasal-verbs',
    'false-friends',
    'confused-words',
    'register',
    'word-families',
  ]),
  title_pl: txt,
  items: z
    .array(
      z.strictObject({
        en: txt,
        pl: txt,
        meaning_pl: txt.optional(),
        example: exSchema,
        register: z.enum(['formal', 'neutral', 'informal']).optional(),
        tags: z.array(txt).optional(),
      }),
    )
    .min(1),
})

const exStep = z.strictObject({ label_pl: txt, text_pl: txt })
const steps = z.array(exStep).min(2).max(5)
const tags = z.array(id).min(1)
const difficulty = z.union([z.literal(1), z.literal(2), z.literal(3)])
// limit wyrazów jak na maturze; skrót liczy się jako jeden wyraz (zasady CKE)
const maxWords = z.number().int().min(1).max(8)

// jedno zdanie z luką "___ (base)": czasy, a z maxWords też zad. 9 z lat 2023-2025
// (wyrazy z nawiasu w podanej kolejności, można zmieniać formy i dodawać słowa)
export const gapFillSchema = z
  .strictObject({
    id,
    type: z.literal('gap-fill'),
    sentence: txt,
    correct: z.array(txt).min(1),
    accepted: z.array(txt).optional(),
    maxWords: maxWords.optional(),
    steps,
    tags,
    difficulty,
  })
  .refine((e) => countGaps(e.sentence) === 1, 'zdanie musi mieć dokładnie jedną lukę "___ (verb)"')

// wybór A-D: zdanie z jedną luką albo tekst z kilkoma (zad. 7 to tekst z 6 lukami)
export const choiceSchema = z
  .strictObject({
    id,
    type: z.literal('choice'),
    title: txt.optional(),
    text: txt,
    gaps: z
      .array(
        z.strictObject({
          options: z.array(txt).min(3).max(4),
          answer: z.number().int().min(0).max(3),
          steps,
        }),
      )
      .min(1),
    tags,
    difficulty,
  })
  .superRefine((e, ctx) => {
    if (countBlanks(e.text) !== e.gaps.length)
      ctx.addIssue({
        code: 'custom',
        message: 'liczba luk ___ w tekście musi równać się liczbie gaps',
      })
    e.gaps.forEach((g, i) => {
      if (g.answer >= g.options.length)
        ctx.addIssue({ code: 'custom', message: `luka ${i + 1}: answer poza listą opcji` })
      if (new Set(g.options).size !== g.options.length)
        ctx.addIssue({ code: 'custom', message: `luka ${i + 1}: powtórzona opcja` })
    })
  })

// słowotwórstwo: wyraz w nawiasie przy luce albo (jak w 2025) ramka z wyrazami, w tym zbędnymi
export const wordFormationSchema = z
  .strictObject({
    id,
    type: z.literal('word-formation'),
    title: txt.optional(),
    text: txt,
    box: z.array(txt).optional(),
    gaps: z
      .array(
        z.strictObject({
          base: txt,
          correct: z.array(txt).min(1),
          accepted: z.array(txt).optional(),
          steps,
        }),
      )
      .min(1),
    tags,
    difficulty,
  })
  .superRefine((e, ctx) => {
    if (countBlanks(e.text) !== e.gaps.length)
      ctx.addIssue({
        code: 'custom',
        message: 'liczba luk ___ w tekście musi równać się liczbie gaps',
      })
    if (e.box) {
      if (e.box.length <= e.gaps.length)
        ctx.addIssue({ code: 'custom', message: 'ramka musi mieć więcej wyrazów niż luk' })
      for (const g of e.gaps)
        if (!e.box.includes(g.base))
          ctx.addIssue({ code: 'custom', message: `wyraz ${g.base} nie jest w ramce` })
    }
  })

// transformacja ze słowem kluczem (zad. 9 w 2026): słowa nie wolno odmieniać, max 5 wyrazów razem z nim
export const keyWordSchema = z
  .strictObject({
    id,
    type: z.literal('key-word-transformation'),
    source: txt,
    keyWord: txt.regex(/^[A-Z][A-Z' -]*$/, 'słowo klucz wielkimi literami'),
    target: txt,
    maxWords: maxWords.default(5),
    correct: z.array(txt).min(1),
    accepted: z.array(txt).optional(),
    steps,
    tags,
    difficulty,
  })
  .refine((e) => countBlanks(e.target) === 1, 'zdanie docelowe musi mieć dokładnie jedną lukę ___')

export const exerciseSchema = z.discriminatedUnion('type', [
  gapFillSchema,
  choiceSchema,
  wordFormationSchema,
  keyWordSchema,
])
export const exerciseFileSchema = z.array(exerciseSchema).min(1)

// obszary tematyczne z podstawy programowej (I.1-I.14), do filtrowania tematów wypracowań i tekstów
export const themeSchema = z.enum([
  'person',
  'home',
  'education',
  'work',
  'private-life',
  'food',
  'shopping',
  'travel',
  'culture',
  'sport',
  'health',
  'science',
  'nature',
  'society',
])

export const writingFormSchema = z.enum(['essay', 'article', 'formal-letter'])
export const criterionSchema = z.enum(['task', 'coherence', 'range', 'accuracy'])

// wypracowanie: temat jak w arkuszu (po polsku, dwa elementy) i opcjonalne wzory z komentarzem
export const writingTaskSchema = z
  .strictObject({
    id,
    type: z.literal('writing-task'),
    form: writingFormSchema,
    theme: themeSchema,
    prompt_pl: txt,
    elements_pl: z.tuple([txt, txt]),
    planHint_pl: txt,
    models: z.array(
      z.strictObject({
        kind: z.enum(['model', 'weaker', 'stronger']),
        title: txt.optional(),
        paragraphs: z.array(txt).min(3),
        annotations: z.array(
          z.strictObject({ quote: txt, criterion: criterionSchema, note_pl: txt }),
        ),
        comment_pl: txt,
      }),
    ),
    tags: z.array(id).optional(),
  })
  .superRefine((w, ctx) => {
    w.models.forEach((m, i) => {
      const all = [m.title ?? '', ...m.paragraphs].join('\n')
      for (const a of m.annotations)
        if (!all.includes(a.quote))
          ctx.addIssue({
            code: 'custom',
            message: `wzór ${i + 1}: cytatu „${a.quote}” nie ma w tekście`,
          })
    })
  })

// samoocena po oddaniu wypracowania: pytania pogrupowane po kryteriach CKE
export const checklistSchema = z.array(
  z.strictObject({
    criterion: criterionSchema,
    max: z.number().int().positive(),
    items: z
      .array(z.strictObject({ text_pl: txt, forms: z.array(writingFormSchema).optional() }))
      .min(1),
  }),
)

const letter = z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'])
const why = txt
// zadania do jednego tekstu (czytanie): formaty z arkuszy, każda odpowiedź z wyjaśnieniem
const readingTaskSchema = z.discriminatedUnion('kind', [
  z.strictObject({
    kind: z.literal('mc'),
    items: z
      .array(
        z.strictObject({
          question: txt,
          options: z.array(txt).min(3).max(4),
          answer: z.number().int().min(0).max(3),
          why_pl: why,
          distractors_pl: z.array(txt).optional(),
        }),
      )
      .min(1),
  }),
  z.strictObject({
    kind: z.literal('paragraph-match'),
    items: z.array(z.strictObject({ statement: txt, answer: letter, why_pl: why })).min(1),
  }),
  z.strictObject({
    kind: z.literal('sentence-insert'),
    sentences: z.array(z.strictObject({ key: letter, text: txt })).min(2),
    answers: z.array(z.strictObject({ answer: letter, why_pl: why })).min(1),
  }),
  z.strictObject({
    kind: z.literal('true-false'),
    items: z.array(z.strictObject({ statement: txt, answer: z.boolean(), why_pl: why })).min(1),
  }),
  z.strictObject({
    kind: z.literal('match'),
    options: z.array(z.strictObject({ key: letter, text: txt })).min(2),
    items: z.array(z.strictObject({ prompt: txt, answer: letter, why_pl: why })).min(1),
  }),
  // mediacja: luka po angielsku na podstawie tekstu, z limitem wyrazów
  z.strictObject({
    kind: z.literal('gap'),
    maxWords: z.number().int().min(1).max(8),
    items: z
      .array(
        z.strictObject({
          sentence: txt,
          correct: z.array(txt).min(1),
          accepted: z.array(txt).optional(),
          why_pl: why,
        }),
      )
      .min(1),
  }),
])

export const readingSetSchema = z
  .strictObject({
    id,
    type: z.literal('reading-set'),
    title: txt,
    genre: z.enum(['article', 'blog', 'advert', 'interview', 'review', 'email', 'story', 'report']),
    theme: themeSchema,
    // akapity z literami (A, B…) przy zadaniu „In which paragraph…”; luki ___ przy wstawianiu zdań
    paragraphs: z.array(z.strictObject({ key: letter.optional(), text: txt })).min(2),
    tasks: z.array(readingTaskSchema).min(1),
    tags: z.array(id).optional(),
  })
  .superRefine((r, ctx) => {
    const blanks = r.paragraphs.reduce((n, p) => n + countBlanks(p.text), 0)
    const inserts = r.tasks.find((t) => t.kind === 'sentence-insert')
    if (blanks !== (inserts?.answers.length ?? 0))
      ctx.addIssue({
        code: 'custom',
        message: 'liczba luk ___ w tekście musi równać się odpowiedziom sentence-insert',
      })
    if (inserts && inserts.sentences.length <= inserts.answers.length)
      ctx.addIssue({ code: 'custom', message: 'przy wstawianiu zdań jedno zdanie ma zostać' })
    const keys = r.paragraphs.map((p) => p.key).filter(Boolean)
    for (const t of r.tasks)
      if (t.kind === 'paragraph-match')
        for (const it of t.items)
          if (!keys.includes(it.answer))
            ctx.addIssue({ code: 'custom', message: `akapit ${it.answer} nie istnieje` })
  })

// próbny zestaw środków językowych: zadania jak 7, 8 i 9 w arkuszu
export const mockSetSchema = z.strictObject({
  id,
  title_pl: txt,
  exercises: z.array(id).min(3),
})

// tekst w notacji [s:…] [a:…] [v:…] [k:…] [n:…], kolory jak w formułach czasów
const marked = txt.superRefine((s, ctx) => {
  const err = markedError(s)
  if (err) ctx.addIssue({ code: 'custom', message: err })
})
const tick = z.number().int().min(0).max(3)

export const grammarScaleSchema = z.strictObject({
  left: txt,
  right: txt,
  ticks: z.tuple([txt, txt, txt, txt]),
  on: z.array(tick).min(1),
  ring: tick.nullable(),
})

export const grammarSubtypeSchema = z.strictObject({
  id,
  label: txt,
  name: txt,
  desc_pl: txt,
  time_pl: txt,
  scale: grammarScaleSchema,
  // key: jeden znak (+, −, ?) rysuje się w kółku, dłuższy to etykieta wiersza, np. „warunek”
  formula: z.array(z.strictObject({ key: txt, text: marked })).min(1),
  usage_pl: z.array(marked).min(1),
  signals: z.array(txt).min(1),
  examples: z.array(z.strictObject({ en: marked, pl: txt })).min(1),
  // sygnał → sytuacja → forma
  steps: z.tuple([marked, marked, marked]),
})

export const grammarTopicSchema = z
  .strictObject({
    id,
    title_pl: txt,
    note_pl: txt,
    chooseTitle_pl: txt,
    defaultSubtype: id,
    // tag zadań do „Ćwicz” i stary pełny temat pod linkiem „cała teoria”
    practiceTag: id,
    theoryTopic: id,
    subtypes: z.array(grammarSubtypeSchema).min(2),
    cheat: z
      .strictObject({
        title_pl: txt,
        headers: z.tuple([txt, txt, txt]),
        // pierwsza kolumna to id podtypu, wtedy wiersz się podświetla
        rows: z.array(z.tuple([id, marked, marked])).min(2),
      })
      .optional(),
  })
  .superRefine((g, ctx) => {
    const ids = g.subtypes.map((s) => s.id)
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({ code: 'custom', message: 'powtórzone id podtypu' })
    if (!ids.includes(g.defaultSubtype))
      ctx.addIssue({ code: 'custom', message: `nie ma podtypu ${g.defaultSubtype}` })
    for (const [ty] of g.cheat?.rows ?? [])
      if (!ids.includes(ty))
        ctx.addIssue({ code: 'custom', message: `ściąga: wiersz ${ty} nie jest podtypem` })
  })

// przekładki w indeksie gramatyki; bez pliku z nowym widokiem i bez topic = „wkrótce”
export const grammarTabsSchema = z
  .array(
    z.strictObject({
      id,
      group: z.enum(['sentences', 'verbs', 'words']),
      tab: z.tuple([txt, txt]),
      label_pl: txt,
      // jedna linijka do spisu zagadnień
      desc_pl: txt,
      // istniejący pełny temat z src/content/topics, otwierany w zakładce Gramatyka
      topic: id.optional(),
    }),
  )
  .min(1)

export type Role = z.infer<typeof roleSchema>
export type FormulaPart = z.infer<typeof formulaPartSchema>
export type Ex = z.infer<typeof exSchema>
export type Formula = z.infer<typeof formulaSchema>
export type FormSet = z.infer<typeof formSetSchema>
export type TimelineMark = z.infer<typeof timelineMarkSchema>
export type Tense = z.infer<typeof tenseSchema>
export type Block = z.infer<typeof blockSchema>
export type Topic = z.infer<typeof topicSchema>
export type PhraseSet = z.infer<typeof phraseSetSchema>
export type PhraseItem = PhraseSet['items'][number]
export type GapFillExercise = z.infer<typeof gapFillSchema>
export type ChoiceExercise = z.infer<typeof choiceSchema>
export type WordFormationExercise = z.infer<typeof wordFormationSchema>
export type KeyWordExercise = z.infer<typeof keyWordSchema>
export type ExStep = z.infer<typeof exStep>
export type Theme = z.infer<typeof themeSchema>
export type WritingForm = z.infer<typeof writingFormSchema>
export type Criterion = z.infer<typeof criterionSchema>
export type WritingTask = z.infer<typeof writingTaskSchema>
export type WritingModel = WritingTask['models'][number]
export type Checklist = z.infer<typeof checklistSchema>
export type ReadingSet = z.infer<typeof readingSetSchema>
export type ReadingTask = ReadingSet['tasks'][number]
export type MockSet = z.infer<typeof mockSetSchema>
export type Exercise = z.infer<typeof exerciseSchema>
export type GrammarScale = z.infer<typeof grammarScaleSchema>
export type GrammarSubtype = z.infer<typeof grammarSubtypeSchema>
export type GrammarTopic = z.infer<typeof grammarTopicSchema>
export type GrammarTab = z.infer<typeof grammarTabsSchema>[number]
