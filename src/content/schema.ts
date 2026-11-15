import { z } from 'zod'
import { countBlanks, countGaps } from '../lib/exercises/gap'

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
  category: z.enum(['grammar', 'modals', 'prepositions', 'phrasal-verbs', 'essay', 'other']),
  title_pl: txt,
  summary_pl: txt,
  blocks: z.array(blockSchema).min(1),
})

export const phraseSetSchema = z.strictObject({
  id,
  category: z.enum(['idioms', 'linkers', 'essay-phrases', 'collocations']),
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
export type Exercise = z.infer<typeof exerciseSchema>
