import type { ReadingSet, ReadingTask } from '../../content/schema'
import { checkLimited } from '../answers/words'

// odpowiedzi do zestawu trzymam pod kluczem "t<zadanie>-<pozycja>", np. "t0-2"
export const itemKey = (task: number, item: number) => `t${task}-${item}`

export function itemCount(task: ReadingTask) {
  return task.kind === 'sentence-insert' ? task.answers.length : task.items.length
}

export type ReadingResult = { key: string; ok: boolean }

export function gradeReading(set: ReadingSet, get: (key: string) => string): ReadingResult[] {
  return set.tasks.flatMap((task, ti) =>
    Array.from({ length: itemCount(task) }, (_, i) => {
      const key = itemKey(ti, i)
      return { key, ok: isRight(task, i, get(key)) }
    }),
  )
}

function isRight(task: ReadingTask, i: number, value: string): boolean {
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
    case 'gap': {
      const it = task.items[i]!
      return checkLimited(value, {
        answers: [...it.correct, ...(it.accepted ?? [])],
        maxWords: task.maxWords,
      }).ok
    }
  }
}
