import { describe, expect, it } from 'vitest'
import type { Exercise } from '../../content/schema'
import { buildSession, filterExercises, tagAccuracy, tagStats } from './session'

function ex(id: string, tags: string[], difficulty: 1 | 2 | 3 = 1): Exercise {
  return {
    id,
    type: 'gap-fill',
    sentence: 'I ___ (go).',
    correct: ['went'],
    steps: [
      { label_pl: 'a', text_pl: 'a' },
      { label_pl: 'b', text_pl: 'b' },
    ],
    tags,
    difficulty,
  }
}

const all = [
  ex('pp1', ['present-perfect']),
  ex('pp2', ['present-perfect'], 2),
  ex('ps1', ['past-simple']),
  ex('ps2', ['past-simple'], 3),
  ex('c1', ['conditionals', 'past-simple'], 2),
  ex('f1', ['future-simple']),
]

// deterministyczny „los”, żeby testy były powtarzalne
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

describe('tagStats', () => {
  it('liczy próby i trafienia dla każdego tagu', () => {
    const s = tagStats([
      { tags: ['past-simple'], correct: true },
      { tags: ['past-simple', 'conditionals'], correct: false },
    ])
    expect(s['past-simple']).toEqual({ attempts: 2, correct: 1 })
    expect(tagAccuracy(s, 'conditionals')).toBe(0)
    expect(tagAccuracy(s, 'future-simple')).toBeNull()
  })
})

describe('filterExercises', () => {
  it('filtr po tagach (którykolwiek pasuje) i poziomie', () => {
    expect(filterExercises(all, ['past-simple']).map((e) => e.id)).toEqual(['ps1', 'ps2', 'c1'])
    expect(filterExercises(all, ['past-simple'], 2).map((e) => e.id)).toEqual(['c1'])
    expect(filterExercises(all, [], undefined)).toHaveLength(all.length)
  })
})

describe('buildSession', () => {
  it('losowo: tylko pasujące, nie więcej niż count, bez powtórek', () => {
    const s = buildSession(all, { mode: 'random', count: 3, random: seeded() })
    expect(s).toHaveLength(3)
    expect(new Set(s.map((e) => e.id)).size).toBe(3)
    const pp = buildSession(all, {
      mode: 'random',
      count: 10,
      tags: ['present-perfect'],
      random: seeded(),
    })
    expect(pp.map((e) => e.id).sort()).toEqual(['pp1', 'pp2'])
  })

  it('słabe punkty: najpierw tagi z najniższą skutecznością, nieznane pośrodku', () => {
    const stats = tagStats([
      { tags: ['present-perfect'], correct: false },
      { tags: ['present-perfect'], correct: false },
      { tags: ['past-simple'], correct: true },
      { tags: ['future-simple'], correct: true },
    ])
    const s = buildSession(all, { mode: 'weak', count: 6, stats, random: seeded(7) })
    const ids = s.map((e) => e.id)
    expect(ids.slice(0, 2).sort()).toEqual(['pp1', 'pp2'])
    // conditionals bez prób (0.5) przed tagami, które mi idą (1.0)
    expect(ids[2]).toBe('c1')
  })

  it('zawsze przynajmniej jedno zdanie, jeśli coś pasuje', () => {
    expect(buildSession(all, { mode: 'random', count: 0, random: seeded() })).toHaveLength(1)
  })
})
