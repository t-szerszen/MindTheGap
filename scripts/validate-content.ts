import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import {
  exerciseFileSchema,
  phraseSetSchema,
  tenseSchema,
  topicSchema,
} from '../src/content/schema'
import { checkContent } from '../src/lib/content/check'

const root = join(import.meta.dirname, '..', 'src', 'content')
const errors: string[] = []

function load<T>(dir: string, schema: z.ZodType<T>): T[] {
  const out: T[] = []
  for (const file of readdirSync(join(root, dir)).filter((f) => f.endsWith('.json'))) {
    const rel = `${dir}/${file}`
    let data: unknown
    try {
      data = JSON.parse(readFileSync(join(root, dir, file), 'utf8'))
    } catch (e) {
      errors.push(`${rel}: zły JSON (${(e as Error).message})`)
      continue
    }
    const r = schema.safeParse(data)
    if (r.success) out.push(r.data)
    else errors.push(`${rel}:\n${z.prettifyError(r.error)}`)
  }
  return out
}

const tenses = load('tenses', tenseSchema)
const topics = load('topics', topicSchema)
const phraseSets = load('phrases', phraseSetSchema)
const exercises = load('exercises', exerciseFileSchema).flat()

errors.push(...checkContent({ tenses, topics, phraseSets, exercises }))

if (errors.length) {
  console.error(`Błędy w treściach (${errors.length}):\n`)
  for (const e of errors) console.error(`✗ ${e}\n`)
  process.exit(1)
}
console.log(
  `Treści OK — czasy: ${tenses.length}, tematy: ${topics.length}, zestawy zwrotów: ${phraseSets.length}, ćwiczenia: ${exercises.length}`,
)
