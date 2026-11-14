import type { Exercise } from '../../content/schema'

export type AttemptLike = { tags: string[]; correct: boolean }
export type TagStats = Record<string, { attempts: number; correct: number }>
export type SessionMode = 'random' | 'weak'

export type SessionOptions = {
  tags?: string[]
  difficulty?: 1 | 2 | 3
  mode: SessionMode
  count: number
  stats?: TagStats
  random?: () => number
}

// tag bez prób ląduje pośrodku: najpierw to, co wiem, że mi nie idzie, potem nieznane
const UNSEEN = 0.5

export function tagStats(attempts: AttemptLike[]): TagStats {
  const out: TagStats = {}
  for (const a of attempts) {
    for (const t of a.tags) {
      const s = (out[t] ??= { attempts: 0, correct: 0 })
      s.attempts += 1
      if (a.correct) s.correct += 1
    }
  }
  return out
}

export function tagAccuracy(stats: TagStats, tag: string) {
  const s = stats[tag]
  return s && s.attempts ? s.correct / s.attempts : null
}

function shuffle<T>(list: T[], random: () => number) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function filterExercises(exercises: Exercise[], tags?: string[], difficulty?: 1 | 2 | 3) {
  return exercises.filter(
    (e) =>
      (!tags?.length || e.tags.some((t) => tags.includes(t))) &&
      (!difficulty || e.difficulty === difficulty),
  )
}

export function buildSession(exercises: Exercise[], opts: SessionOptions): Exercise[] {
  const random = opts.random ?? Math.random
  const pool = shuffle(filterExercises(exercises, opts.tags, opts.difficulty), random)
  if (opts.mode === 'weak') {
    const stats = opts.stats ?? {}
    const score = (e: Exercise) => Math.min(...e.tags.map((t) => tagAccuracy(stats, t) ?? UNSEEN))
    // sort jest stabilny, więc przy równych wynikach zostaje losowa kolejność z shuffle
    pool.sort((a, b) => score(a) - score(b))
  }
  return pool.slice(0, Math.max(1, opts.count))
}
