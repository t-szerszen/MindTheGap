import type { ReadingSet, ReadingTask } from '../../content/schema'
import { checkLimited, type LimitCheck } from '../answers/words'

// odpowiedzi do zestawu trzymam pod kluczem "t<zadanie>-<pozycja>", np. "t0-2"
export const itemKey = (task: number, item: number) => `t${task}-${item}`

// tag z typem zadania idzie do każdej próby: po nim postęp i „Ostatnio” wiedzą, że to czytanie
export const readingTags = ['reading-4', 'reading-5', 'reading-6', 'reading'] as const
export type ReadingTag = (typeof readingTags)[number]

export function readingTag(set: Pick<ReadingSet, 'examTask'>): ReadingTag {
  return set.examTask ? `reading-${set.examTask}` : 'reading'
}

export function attemptTags(set: Pick<ReadingSet, 'examTask' | 'tags'>) {
  return [readingTag(set), ...(set.tags ?? [])]
}

export function itemCount(task: ReadingTask) {
  return task.kind === 'sentence-insert' ? task.answers.length : task.items.length
}

// reason tylko przy lukach otwartych: „za długo” to co innego niż „źle”
export type ReadingResult = {
  key: string
  ok: boolean
  reason?: Extract<LimitCheck, { ok: false }>['reason']
}

export function gradeReading(set: ReadingSet, get: (key: string) => string): ReadingResult[] {
  return set.tasks.flatMap((task, ti) =>
    Array.from({ length: itemCount(task) }, (_, i) => {
      const key = itemKey(ti, i)
      const value = get(key)
      if (task.kind !== 'gap') return { key, ok: isRight(task, i, value) }
      const r = checkGap(task, i, value)
      return r.ok ? { key, ok: true } : { key, ok: false, reason: r.reason }
    }),
  )
}

function checkGap(task: Extract<ReadingTask, { kind: 'gap' }>, i: number, value: string) {
  const it = task.items[i]!
  return checkLimited(value, {
    answers: [...it.correct, ...(it.accepted ?? [])],
    maxWords: task.maxWords,
  })
}

function isRight(task: Exclude<ReadingTask, { kind: 'gap' }>, i: number, value: string): boolean {
  switch (task.kind) {
    case 'mc':
      return value === String(task.items[i]!.answer)
    case 'paragraph-match':
    case 'match':
      return value === task.items[i]!.answer
    case 'sentence-insert':
      return value === task.answers[i]!.answer
    case 'true-false':
      return value === String(task.items[i]!.answer)
  }
}
