import type { Exercise, PhraseSet, Tense, Topic } from '../../content/schema'

export type ContentSet = {
  tenses: Tense[]
  topics: Topic[]
  phraseSets: PhraseSet[]
  exercises: Exercise[]
}

function dupes(ids: string[]) {
  const seen = new Set<string>()
  const out = new Set<string>()
  for (const id of ids) (seen.has(id) ? out : seen).add(id)
  return [...out]
}

// to, czego nie da się sprawdzić schematem jednego pliku: powiązania między plikami
export function checkContent(c: ContentSet): string[] {
  const errors: string[] = []
  const tenseIds = c.tenses.map((t) => t.id)
  const topicIds = c.topics.map((t) => t.id)

  for (const id of dupes(tenseIds)) errors.push(`powtórzone id czasu: ${id}`)
  for (const id of dupes(topicIds)) errors.push(`powtórzone id tematu: ${id}`)
  for (const id of dupes(c.phraseSets.map((p) => p.id))) errors.push(`powtórzone id zestawu: ${id}`)
  for (const id of dupes(c.exercises.map((e) => e.id)))
    errors.push(`powtórzone id ćwiczenia: ${id}`)
  for (const id of tenseIds.filter((t) => topicIds.includes(t)))
    errors.push(`id ${id} jest i czasem, i tematem (tagi ćwiczeń by się myliły)`)
  for (const o of dupes(c.tenses.map((t) => String(t.order))))
    errors.push(`dwa czasy mają ten sam order: ${o}`)

  for (const t of c.tenses) {
    for (const r of t.relatedTenses) {
      if (!tenseIds.includes(r.id))
        errors.push(`${t.id}: relatedTenses wskazuje na brakujący czas ${r.id}`)
    }
  }

  const tags = new Set([...tenseIds, ...topicIds])
  // nazwa czasu w zdaniu to podpowiedź, a na maturze jej nie ma
  const tenseNames = c.tenses.map((t) =>
    t.nameEn
      .replace(/\(.*\)/, '')
      .trim()
      .toLowerCase(),
  )
  for (const e of c.exercises) {
    for (const tag of e.tags) {
      if (!tags.has(tag)) errors.push(`${e.id}: tag ${tag} nie jest ani czasem, ani tematem`)
    }
    const s = e.sentence.toLowerCase()
    const hint = tenseNames.find((n) => s.includes(n))
    if (hint) errors.push(`${e.id}: zdanie podpowiada czas („${hint}”)`)
  }
  return errors
}
