import type { Exercise } from '../../content/schema'
import { isCorrect } from '../answers'

// nowy typ ćwiczenia = nowy case tutaj i w ExerciseItem
export function checkAnswer(ex: Exercise, answer: string) {
  switch (ex.type) {
    case 'gap-fill':
      return isCorrect(answer, [...ex.correct, ...(ex.accepted ?? [])])
  }
}
