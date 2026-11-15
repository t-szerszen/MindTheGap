import type {
  Exercise,
  GrammarTab,
  GrammarTopic,
  MockSet,
  PhraseSet,
  ReadingSet,
  Tense,
  Topic,
  WritingTask,
} from '../../content/schema'
import { normalizeBasic } from '../answers'
import { countWords } from '../answers/words'
import { points } from '../exercises/check'

export type ContentSet = {
  tenses: Tense[]
  topics: Topic[]
  phraseSets: PhraseSet[]
  exercises: Exercise[]
  writing?: WritingTask[]
  reading?: ReadingSet[]
  mocks?: MockSet[]
  grammar?: GrammarTopic[]
  grammarTabs?: GrammarTab[]
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
  const seen = new Map<string, string>()
  for (const e of c.exercises) {
    for (const tag of e.tags) {
      if (!tags.has(tag)) errors.push(`${e.id}: tag ${tag} nie jest ani czasem, ani tematem`)
    }
    const text = exerciseText(e)
    const low = text.toLowerCase()
    const hint = tenseNames.find((n) => low.includes(n)) ?? GRAMMAR_TERMS.exec(low)?.[0]
    if (hint) errors.push(`${e.id}: zdanie podpowiada strukturę („${hint}”)`)

    // to samo zdanie w dwóch zadaniach to ten sam punkt dwa razy
    const norm = low
      .replace(/[^a-z ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    const twin = seen.get(norm)
    if (twin) errors.push(`${e.id}: to samo zdanie co w ${twin}`)
    else seen.set(norm, e.id)

    for (const [label, answers] of answerSets(e)) {
      // skróty sprawdzarka rozwija sama, więc "'ll close" obok "will close" to zbędny duplikat
      for (const a of dupes(answers.map(normalizeBasic)))
        errors.push(`${e.id}${label}: odpowiedź „${a}” powtarza się po rozwinięciu skrótów`)
      for (const a of answers) {
        if (/_{3,}/.test(a)) errors.push(`${e.id}${label}: w odpowiedzi zostało ___`)
        const limit =
          e.type === 'gap-fill'
            ? e.maxWords
            : e.type === 'key-word-transformation'
              ? e.maxWords
              : undefined
        if (limit && countWords(a) > limit)
          errors.push(`${e.id}${label}: „${a}” ma więcej niż ${limit} wyrazów`)
        if (e.type === 'key-word-transformation' && !hasWord(a, e.keyWord))
          errors.push(
            `${e.id}: „${a}” nie zawiera słowa klucza ${e.keyWord} w niezmienionej formie`,
          )
        if (e.type === 'word-formation' && /\s/.test(a.trim()))
          errors.push(`${e.id}${label}: słowotwórstwo to jeden wyraz, a „${a}” ma kilka`)
      }
    }
    if (e.type === 'key-word-transformation' && hasWord(e.target, e.keyWord))
      errors.push(`${e.id}: słowo klucz jest już w zdaniu docelowym`)
    if (e.type === 'word-formation')
      e.gaps.forEach((g, i) => {
        if (g.correct.some((a) => normalizeBasic(a) === normalizeBasic(g.base)))
          errors.push(`${e.id}#${i + 1}: odpowiedź to sam wyraz bazowy ${g.base}`)
      })
  }
  const writing = c.writing ?? []
  const reading = c.reading ?? []
  const mocks = c.mocks ?? []
  const allIds = [
    ...c.exercises.map((e) => e.id),
    ...writing.map((w) => w.id),
    ...reading.map((r) => r.id),
    ...mocks.map((m) => m.id),
  ]
  for (const id of dupes(allIds)) errors.push(`id ${id} jest użyte w dwóch miejscach`)
  for (const x of [...writing, ...reading])
    for (const tag of x.tags ?? [])
      if (!tags.has(tag)) errors.push(`${x.id}: tag ${tag} nie jest ani czasem, ani tematem`)

  // wzory liczę jak CKE: bez tytułu, skrót i wyraz z łącznikiem to jeden wyraz
  for (const w of writing)
    w.models.forEach((m, i) => {
      const n = countWords(m.paragraphs.join(' '))
      if (n < 200 || n > 250)
        errors.push(`${w.id}: wzór ${i + 1} ma ${n} wyrazów, a powinien 200-250`)
    })

  // arkusz próbny ma wyglądać jak część z zadaniami 7-9: razem 14 punktów
  const byId = new Map(c.exercises.map((e) => [e.id, e]))
  for (const m of mocks) {
    const list = m.exercises.map((id) => byId.get(id))
    m.exercises.forEach((id, i) => {
      if (!list[i]) errors.push(`${m.id}: nie ma ćwiczenia ${id}`)
    })
    const total = list.reduce((n, e) => n + (e ? points(e) : 0), 0)
    if (total !== 14) errors.push(`${m.id}: ${total} pkt zamiast 14 jak w arkuszu`)
  }

  const grammar = c.grammar ?? []
  const grammarTabs = c.grammarTabs ?? []
  const tabIds = grammarTabs.map((t) => t.id)
  for (const id of dupes(tabIds)) errors.push(`powtórzona przekładka gramatyki: ${id}`)
  for (const id of dupes(grammar.map((g) => g.id))) errors.push(`powtórzone id gramatyki: ${id}`)
  for (const t of grammarTabs)
    if (t.topic && !topicIds.includes(t.topic))
      errors.push(`przekładka ${t.id}: nie ma tematu ${t.topic}`)
  for (const g of grammar) {
    if (!tabIds.includes(g.id)) errors.push(`gramatyka ${g.id}: brak przekładki w tabs.json`)
    if (!tags.has(g.practiceTag))
      errors.push(`gramatyka ${g.id}: tag ${g.practiceTag} nie istnieje`)
    if (!topicIds.includes(g.theoryTopic))
      errors.push(`gramatyka ${g.id}: nie ma tematu ${g.theoryTopic}`)
  }
  return errors
}

// nazwy struktur, które w zdaniu zadania byłyby podpowiedzią
const GRAMMAR_TERMS =
  /\b(passive voice|reported speech|(zero|first|second|third|mixed) conditional|gerund|bare infinitive|inversion|past participle|present participle|modal verb|relative clause|causative)\b/

function exerciseText(e: Exercise) {
  switch (e.type) {
    case 'gap-fill':
      return e.sentence
    case 'key-word-transformation':
      return `${e.source} ${e.target}`
    case 'choice':
    case 'word-formation':
      return e.text
  }
}

// odpowiedzi pogrupowane po lukach: [etykieta luki, lista poprawnych i akceptowanych]
function answerSets(e: Exercise): [string, string[]][] {
  switch (e.type) {
    case 'gap-fill':
    case 'key-word-transformation':
      return [['', [...e.correct, ...(e.accepted ?? [])]]]
    case 'word-formation':
      return e.gaps.map((g, i) => [`#${i + 1}`, [...g.correct, ...(g.accepted ?? [])]])
    case 'choice':
      return []
  }
}

function hasWord(text: string, word: string) {
  const words = normalizeBasic(text).split(/[^a-z']+/)
  const key = normalizeBasic(word).split(' ')
  return words.some((_, i) => key.every((k, j) => words[i + j] === k))
}
