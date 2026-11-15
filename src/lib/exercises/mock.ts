import type { Exercise } from '../../content/schema'
import { points } from './check'

// część „znajomość środków językowych” jak w arkuszu: zad. 7 cloze A-D (6 luk), zad. 8 słowotwórstwo
// (4 luki), zad. 9 cztery zdania — transformacje albo zdania z wyrazami w nawiasie, bo CKE zmienia format
export const MOCK_POINTS = 14

export type MockPart = { task: 7 | 8 | 9; exercises: Exercise[] }

function pick<T>(list: T[], n: number, random: () => number): T[] {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a.slice(0, n)
}

export function buildMock(
  exercises: Exercise[],
  random: () => number = Math.random,
): MockPart[] | null {
  const cloze = exercises.filter((e) => e.type === 'choice' && e.gaps.length === 6)
  const wfText = exercises.filter((e) => e.type === 'word-formation' && e.gaps.length === 4)
  const wfSingle = exercises.filter((e) => e.type === 'word-formation' && e.gaps.length === 1)
  const kwt = exercises.filter((e) => e.type === 'key-word-transformation')
  const words = exercises.filter((e) => e.type === 'gap-fill' && e.maxWords)

  const seven = pick(cloze, 1, random)
  const eight =
    wfText.length && (random() < 0.5 || wfSingle.length < 4)
      ? pick(wfText, 1, random)
      : pick(wfSingle, 4, random)
  const first = random() < 0.5 ? kwt : words
  const nine =
    first.length >= 4 ? pick(first, 4, random) : pick(first === kwt ? words : kwt, 4, random)

  const parts: MockPart[] = [
    { task: 7, exercises: seven },
    { task: 8, exercises: eight },
    { task: 9, exercises: nine },
  ]
  return parts.every((p) => p.exercises.length) && total(parts) === MOCK_POINTS ? parts : null
}

// gotowy zestaw z treści: zadania układam po typie w kolejności arkusza
export function partsFromIds(ids: string[], exercises: Exercise[]): MockPart[] {
  const list = ids.map((id) => exercises.find((e) => e.id === id)).filter((e): e is Exercise => !!e)
  return [
    { task: 7 as const, exercises: list.filter((e) => e.type === 'choice') },
    { task: 8 as const, exercises: list.filter((e) => e.type === 'word-formation') },
    {
      task: 9 as const,
      exercises: list.filter((e) => e.type === 'key-word-transformation' || e.type === 'gap-fill'),
    },
  ].filter((p) => p.exercises.length)
}

export const total = (parts: MockPart[]) =>
  parts.reduce((n, p) => n + p.exercises.reduce((m, e) => m + points(e), 0), 0)
