import { z } from 'zod'
import {
  exerciseFileSchema,
  phraseSetSchema,
  tenseSchema,
  topicSchema,
  type Exercise,
  type PhraseSet,
  type Tense,
  type Topic,
} from '../../content/schema'

// jedyne miejsce, które dotyka plików z treścią; komponenty biorą dane stąd
const tenseFiles = import.meta.glob('../../content/tenses/*.json', {
  eager: true,
  import: 'default',
})
const topicFiles = import.meta.glob('../../content/topics/*.json', {
  eager: true,
  import: 'default',
})
const phraseFiles = import.meta.glob('../../content/phrases/*.json', {
  eager: true,
  import: 'default',
})
const exerciseFiles = import.meta.glob('../../content/exercises/*.json', {
  eager: true,
  import: 'default',
})

function parseAll<T>(files: Record<string, unknown>, schema: z.ZodType<T>): T[] {
  return Object.entries(files).map(([path, data]) => {
    const r = schema.safeParse(data)
    // walidator w CI łapie to wcześniej, tu tylko na wszelki wypadek
    if (!r.success) throw new Error(`${path}\n${z.prettifyError(r.error)}`)
    return r.data
  })
}

let tenses: Tense[] | undefined
let topics: Topic[] | undefined
let phraseSets: PhraseSet[] | undefined
let exercises: Exercise[] | undefined

export function getTenses() {
  tenses ??= parseAll(tenseFiles, tenseSchema).sort((a, b) => a.order - b.order)
  return tenses
}

export function getTense(id: string) {
  return getTenses().find((t) => t.id === id)
}

export function getTopics() {
  topics ??= parseAll(topicFiles, topicSchema).sort((a, b) =>
    a.title_pl.localeCompare(b.title_pl, 'pl'),
  )
  return topics
}

export function getTopic(id: string) {
  return getTopics().find((t) => t.id === id)
}

export function getPhraseSets() {
  phraseSets ??= parseAll(phraseFiles, phraseSetSchema).sort((a, b) =>
    a.title_pl.localeCompare(b.title_pl, 'pl'),
  )
  return phraseSets
}

export function getPhraseSet(id: string) {
  return getPhraseSets().find((p) => p.id === id)
}

export function getExercises() {
  exercises ??= parseAll(exerciseFiles, exerciseFileSchema).flat()
  return exercises
}

export function getExercise(id: string) {
  return getExercises().find((e) => e.id === id)
}
