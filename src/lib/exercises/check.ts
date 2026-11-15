import type { Exercise } from '../../content/schema'
import { isCorrect } from '../answers'
import { checkLimited, type LimitCheck } from '../answers/words'
import { splitBlanks } from './gap'

// każda luka to osobny punkt, jak na maturze: cloze z 6 lukami = 6 punktów.
// Odpowiedzi trzymam pod kluczem części: "id" dla zadań z jedną luką, "id#2" dla drugiej luki w tekście.
// Nowy typ ćwiczenia = nowy case tutaj i w ExerciseItem.
export function partKeys(ex: Exercise): string[] {
  switch (ex.type) {
    case 'gap-fill':
    case 'key-word-transformation':
      return [ex.id]
    case 'choice':
    case 'word-formation':
      return ex.gaps.map((_, i) => `${ex.id}#${i + 1}`)
  }
}

export type MissReason = Exclude<LimitCheck, { ok: true }>['reason']
export type PartResult = { key: string; ok: boolean; reason?: MissReason }

export function gradeExercise(ex: Exercise, get: (key: string) => string): PartResult[] {
  switch (ex.type) {
    case 'gap-fill': {
      const answers = [...ex.correct, ...(ex.accepted ?? [])]
      const value = get(ex.id)
      if (!ex.maxWords) return [{ key: ex.id, ok: isCorrect(value, answers) }]
      return [limited(ex.id, checkLimited(value, { answers, maxWords: ex.maxWords }))]
    }
    case 'key-word-transformation':
      return [
        limited(
          ex.id,
          checkLimited(get(ex.id), {
            answers: [...ex.correct, ...(ex.accepted ?? [])],
            maxWords: ex.maxWords,
            keyWord: ex.keyWord,
          }),
        ),
      ]
    case 'choice':
      return ex.gaps.map((g, i) => {
        const key = `${ex.id}#${i + 1}`
        return { key, ok: get(key) === String(g.answer) }
      })
    case 'word-formation':
      return ex.gaps.map((g, i) => {
        const key = `${ex.id}#${i + 1}`
        return { key, ok: isCorrect(get(key), [...g.correct, ...(g.accepted ?? [])]) }
      })
  }
}

function limited(key: string, r: LimitCheck): PartResult {
  return r.ok ? { key, ok: true } : { key, ok: false, reason: r.reason }
}

export const points = (ex: Exercise) => partKeys(ex).length

// krótki opis zadania do listy ostatnich prób na stronie startowej
export function exerciseLabel(ex: Exercise) {
  switch (ex.type) {
    case 'gap-fill':
      return ex.sentence.replace(/___ \(([^)]+)\)/, '___')
    case 'key-word-transformation':
      return ex.source
    case 'choice':
    case 'word-formation':
      return ex.title ?? `${splitBlanks(ex.text)[0]!.trim().slice(0, 70)}…`
  }
}
