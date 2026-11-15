type AttemptLike = { exerciseId: string; correct: boolean; at: Date }

// jedno „Sprawdź” zapisuje każdą pozycję osobno, prawie w tej samej chwili,
// więc ostatni wynik to próby z minuty przed najnowszą
const SAME_CHECK_MS = 60_000

export function lastReadingScore(setId: string, attempts: AttemptLike[]) {
  const mine = attempts.filter((a) => a.exerciseId.startsWith(`${setId}#`))
  if (!mine.length) return null
  const latest = Math.max(...mine.map((a) => +a.at))
  const last = new Map<string, boolean>()
  for (const a of mine)
    if (latest - +a.at < SAME_CHECK_MS && !last.has(a.exerciseId)) last.set(a.exerciseId, a.correct)
  const good = [...last.values()].filter(Boolean).length
  return { good, total: last.size, at: new Date(latest) }
}
