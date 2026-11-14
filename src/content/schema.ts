import { z } from 'zod'
import { countGaps } from '../lib/exercises/gap'

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

export const gapFillSchema = z
  .strictObject({
    id,
    type: z.literal('gap-fill'),
    sentence: txt,
    correct: z.array(txt).min(1),
    accepted: z.array(txt).optional(),
    steps: z
      .array(z.strictObject({ label_pl: txt, text_pl: txt }))
      .min(2)
      .max(5),
    tags: z.array(id).min(1),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  })
  .refine((e) => countGaps(e.sentence) === 1, 'zdanie musi mieć dokładnie jedną lukę "___ (verb)"')

// kolejne typy (multiple-choice, transformation) dopisuje się tutaj i w ExerciseItem
export const exerciseSchema = z.discriminatedUnion('type', [gapFillSchema])
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
export type Exercise = z.infer<typeof exerciseSchema>
