import { describe, expect, it } from 'vitest'
import { currentStreak, dayKey, thisWeek } from './streak'

// sobota, 14 listopada 2026
const today = new Date(2026, 10, 14, 15, 0)

describe('dayKey', () => {
  it('lokalna data w formacie RRRR-MM-DD', () => {
    expect(dayKey(today)).toBe('2026-11-14')
    expect(dayKey(new Date(2026, 0, 3))).toBe('2026-01-03')
  })
})

describe('currentStreak', () => {
  it('liczy dni z rzędu kończące się dziś', () => {
    expect(currentStreak(['2026-11-12', '2026-11-13', '2026-11-14'], today)).toBe(3)
  })

  it('jeśli dziś jeszcze nic, liczy do wczoraj', () => {
    expect(currentStreak(['2026-11-12', '2026-11-13'], today)).toBe(2)
  })

  it('dziura przerywa serię', () => {
    expect(currentStreak(['2026-11-10', '2026-11-12'], today)).toBe(0)
    expect(currentStreak(['2026-11-10', '2026-11-13', '2026-11-14'], today)).toBe(2)
  })

  it('przez granicę miesiąca', () => {
    const d = new Date(2026, 11, 1)
    expect(currentStreak(['2026-11-29', '2026-11-30', '2026-12-01'], d)).toBe(3)
  })
})

describe('thisWeek', () => {
  it('od poniedziałku do niedzieli, z dzisiejszym dniem i przyszłością', () => {
    const w = thisWeek(['2026-11-09', '2026-11-14'], today)
    expect(w.map((d) => d.key)).toEqual([
      '2026-11-09',
      '2026-11-10',
      '2026-11-11',
      '2026-11-12',
      '2026-11-13',
      '2026-11-14',
      '2026-11-15',
    ])
    expect(w[0]!.done).toBe(true)
    expect(w[5]).toMatchObject({ done: true, today: true, future: false })
    expect(w[6]!.future).toBe(true)
  })
})
