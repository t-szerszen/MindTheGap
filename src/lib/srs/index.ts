import {
  DAY_MS,
  INTERVAL_DAYS,
  LEECH_LAPSES,
  LEECH_MAX_ACCURACY,
  LEECH_MIN_ATTEMPTS,
  MAX_BOX,
  MIN_BOX,
} from './constants'

// pudełka Leitnera: dobrze = pudełko wyżej i dłuższa przerwa, źle = z powrotem do pierwszego

export type CardState = {
  box: number
  dueAt: Date
  attempts: number
  correct: number
  lapses: number
  streak: number
  lastReviewedAt: Date | null
}

// nowe słówko jest do powtórki od razu, żeby trafiło do pierwszej sesji
export function newCard(now: Date): CardState {
  return {
    box: MIN_BOX,
    dueAt: now,
    attempts: 0,
    correct: 0,
    lapses: 0,
    streak: 0,
    lastReviewedAt: null,
  }
}

export function intervalDays(box: number) {
  const b = Math.min(Math.max(Math.round(box), MIN_BOX), MAX_BOX)
  return INTERVAL_DAYS[b - 1]!
}

export function review(s: CardState, knew: boolean, now: Date): CardState {
  const box = knew ? Math.min(s.box + 1, MAX_BOX) : MIN_BOX
  return {
    box,
    attempts: s.attempts + 1,
    correct: s.correct + (knew ? 1 : 0),
    lapses: knew ? s.lapses : s.lapses + 1,
    streak: knew ? s.streak + 1 : 0,
    lastReviewedAt: now,
    dueAt: new Date(now.getTime() + intervalDays(box) * DAY_MS),
  }
}

export function accuracy(s: Pick<CardState, 'attempts' | 'correct'>) {
  return s.attempts ? s.correct / s.attempts : null
}

export function isLeech(s: Pick<CardState, 'attempts' | 'correct' | 'lapses'>) {
  if (s.lapses >= LEECH_LAPSES) return true
  return s.attempts >= LEECH_MIN_ATTEMPTS && s.correct / s.attempts < LEECH_MAX_ACCURACY
}

export function isDue(s: Pick<CardState, 'dueAt'>, now: Date) {
  return s.dueAt.getTime() <= now.getTime()
}

export function dueCards<T extends CardState>(cards: T[], now: Date) {
  return cards.filter((c) => isDue(c, now)).sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
}

// najgorsze na górze: najniższa skuteczność, przy remisie więcej wpadek
export function leeches<T extends CardState>(cards: T[]) {
  return cards
    .filter(isLeech)
    .sort((a, b) => (accuracy(a) ?? 0) - (accuracy(b) ?? 0) || b.lapses - a.lapses)
}

export function nextDue<T extends CardState>(cards: T[], now: Date) {
  const future = cards.filter((c) => !isDue(c, now)).map((c) => c.dueAt.getTime())
  return future.length ? new Date(Math.min(...future)) : null
}
