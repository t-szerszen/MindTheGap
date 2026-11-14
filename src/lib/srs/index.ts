import { MIN_BOX } from './constants'

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
