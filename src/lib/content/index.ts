import { use } from 'react'
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

// jedyne miejsce, które dotyka plików z treścią; komponenty biorą dane stąd.
// Czasy są małe i potrzebne prawie wszędzie, więc idą od razu. Reszta (tematy, zestawy, ćwiczenia)
// ładuje się dopiero na stronie, która jej potrzebuje: każdy rodzaj to osobny kawałek bundla.
const tenseFiles = import.meta.glob('../../content/tenses/*.json', {
  eager: true,
  import: 'default',
})

function parse<T>(path: string, data: unknown, schema: z.ZodType<T>): T {
  const r = schema.safeParse(data)
  // walidator w CI łapie to wcześniej, tu tylko na wszelki wypadek
  if (!r.success) throw new Error(`${path}\n${z.prettifyError(r.error)}`)
  return r.data
}

type Loader = Record<string, () => Promise<unknown>>

function lazy<T, F>(files: Loader, schema: z.ZodType<F>, finish: (parsed: F[]) => T[]) {
  let promise: Promise<T[]> | undefined
  let value: T[] | undefined
  return {
    load() {
      promise ??= Promise.all(
        Object.entries(files).map(async ([path, load]) => parse(path, await load(), schema)),
      ).then((parsed) => (value = finish(parsed)))
      return promise
    },
    peek: () => value,
  }
}

let tenses: Tense[] | undefined

export function getTenses() {
  tenses ??= Object.entries(tenseFiles)
    .map(([path, data]) => parse(path, data, tenseSchema))
    .sort((a, b) => a.order - b.order)
  return tenses
}

export function getTense(id: string) {
  return getTenses().find((t) => t.id === id)
}

const byTitle = <T extends { title_pl: string }>(list: T[]) =>
  list.sort((a, b) => a.title_pl.localeCompare(b.title_pl, 'pl'))

export const topicStore = lazy<Topic, Topic>(
  import.meta.glob('../../content/topics/*.json', { import: 'default' }),
  topicSchema,
  byTitle,
)

export const phraseSetStore = lazy<PhraseSet, PhraseSet>(
  import.meta.glob('../../content/phrases/*.json', { import: 'default' }),
  phraseSetSchema,
  byTitle,
)

export const exerciseStore = lazy<Exercise, Exercise[]>(
  import.meta.glob('../../content/exercises/*.json', { import: 'default' }),
  exerciseFileSchema,
  (files) => files.flat(),
)

// hooki zawieszają komponent do pierwszego załadowania (Suspense w Shell pokazuje „ładuję”)
export const useTopics = () => use(topicStore.load())
export const usePhraseSets = () => use(phraseSetStore.load())
export const useExercises = () => use(exerciseStore.load())
