// te same grupy co w ćwiczeniach i postępie (practiceGroup w topics/hub), plus czytanie
export type ExerciseArea = 'tenses' | 'grammar' | 'vocabulary' | 'exam' | 'reading'

export type TagInfo = { area: ExerciseArea; name: string; en?: boolean }

type AttemptIn = {
  id: string
  exerciseId: string
  tags: string[]
  correct: boolean
  answer: string
  at: Date
}
type WordIn = { createdAt: Date; lastReviewedAt: Date | null }

export type AreaSummary<A extends AttemptIn = AttemptIn> = {
  kind: 'exercises'
  area: ExerciseArea
  tasks: number
  correct: number
  lastAt: Date
  topic?: { tag: string; name: string; en?: boolean }
  last: A[]
}

export type WordsSummary = { kind: 'words'; reviewed: number; saved: number; lastAt: Date }

export type RecentSummary<A extends AttemptIn = AttemptIn> = {
  // true = w ostatnim tygodniu nic nie było, pokazuję ostatni dzień nauki
  fallback: boolean
  since: Date
  areas: (AreaSummary<A> | WordsSummary)[]
}

export const RECENT_DAYS = 7
const LAST_SHOWN = 3

// zad. 9 i czytanie mają też tagi gramatyczne (np. passive-voice), ale ćwiczyło się maturę,
// więc ona wygrywa
function pickTag(tags: string[], catalog: Record<string, TagInfo>): string | undefined {
  const area = (t: string) => catalog[t]?.area
  return (
    tags.find((t) => area(t) === 'exam' || area(t) === 'reading') ?? tags.find((t) => catalog[t])
  )
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())

export function summarizeRecent<A extends AttemptIn>(
  attempts: A[],
  words: WordIn[],
  catalog: Record<string, TagInfo>,
  now: Date,
): RecentSummary<A> {
  const times = [
    ...attempts.map((a) => a.at),
    ...words.map((w) => w.createdAt),
    ...words.flatMap((w) => (w.lastReviewedAt ? [w.lastReviewedAt] : [])),
  ]
  const weekAgo = startOfDay(new Date(now.getTime() - (RECENT_DAYS - 1) * 86_400_000))
  const latest = times.reduce<Date | null>((m, t) => (!m || t > m ? t : m), null)
  if (!latest) return { fallback: false, since: weekAgo, areas: [] }
  const fallback = latest < weekAgo
  const since = fallback ? startOfDay(latest) : weekAgo
  const until = fallback ? new Date(since.getTime() + 86_400_000) : null
  const inWindow = (t: Date) => t >= since && (!until || t < until)

  type Acc = AreaSummary<A> & { topics: Map<string, number> }
  const byArea = new Map<ExerciseArea, Acc>()
  const sorted = attempts.filter((a) => inWindow(a.at)).sort((x, y) => +y.at - +x.at)
  for (const a of sorted) {
    const tag = pickTag(a.tags, catalog)
    // bez znanego tagu (np. czytanie) to i tak zadanie maturalne
    const area = tag ? catalog[tag]!.area : 'exam'
    let acc = byArea.get(area)
    if (!acc) {
      acc = {
        kind: 'exercises',
        area,
        tasks: 0,
        correct: 0,
        lastAt: a.at,
        last: [],
        topics: new Map(),
      }
      byArea.set(area, acc)
    }
    acc.tasks += 1
    if (a.correct) acc.correct += 1
    if (acc.last.length < LAST_SHOWN) acc.last.push(a)
    if (tag) acc.topics.set(tag, (acc.topics.get(tag) ?? 0) + 1)
  }

  const areas: (AreaSummary<A> | WordsSummary)[] = [...byArea.values()].map(({ topics, ...s }) => {
    // przy remisie wygrywa świeższy temat: Map trzyma kolejność od najnowszej próby
    let best: string | undefined
    for (const [tag, n] of topics) if (!best || n > topics.get(best)!) best = tag
    return best ? { ...s, topic: { tag: best, ...nameOf(catalog[best]!) } } : s
  })

  const saved = words.filter((w) => inWindow(w.createdAt))
  const reviewed = words.filter((w) => w.lastReviewedAt && inWindow(w.lastReviewedAt))
  if (saved.length || reviewed.length) {
    const last = [...saved.map((w) => w.createdAt), ...reviewed.map((w) => w.lastReviewedAt!)]
    areas.push({
      kind: 'words',
      saved: saved.length,
      reviewed: reviewed.length,
      lastAt: last.reduce((m, t) => (t > m ? t : m)),
    })
  }

  areas.sort((x, y) => +y.lastAt - +x.lastAt)
  return { fallback, since, areas }
}

const nameOf = (t: TagInfo) => (t.en ? { name: t.name, en: true } : { name: t.name })
