import { describe, expect, it } from 'vitest'
import { lastReadingScore } from './last'

const at = (min: number) => new Date(2026, 10, 15, 12, min)

describe('lastReadingScore', () => {
  it('liczy tylko ostatnie sprawdzenie tego zestawu', () => {
    const attempts = [
      { exerciseId: 'r4#t0-0', correct: true, at: at(30) },
      { exerciseId: 'r4#t0-1', correct: false, at: at(30) },
      { exerciseId: 'r4#t0-0', correct: false, at: at(5) },
      { exerciseId: 'r40#t0-0', correct: true, at: at(31) },
    ]
    expect(lastReadingScore('r4', attempts)).toEqual({ good: 1, total: 2, at: at(30) })
    expect(lastReadingScore('r5', attempts)).toBeNull()
  })
})
