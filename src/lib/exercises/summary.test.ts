import { describe, expect, it } from 'vitest'
import { summarizeRecent, type TagInfo } from './summary'

const catalog: Record<string, TagInfo> = {
  'present-perfect': { area: 'tenses', name: 'Present Perfect', en: true },
  'past-simple': { area: 'tenses', name: 'Past Simple', en: true },
  'passive-voice': { area: 'grammar', name: 'Strona bierna' },
  'key-word-transformations': { area: 'exam', name: 'Zadanie 9' },
  collocations: { area: 'vocabulary', name: 'Kolokacje' },
  'reading-5': { area: 'reading', name: 'zad. 5' },
}

const now = new Date(2026, 10, 15, 18, 0)
const at = (daysAgo: number, hour = 12) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, hour)
let n = 0
const attempt = (tags: string[], correct: boolean, when: Date) => ({
  id: String(++n),
  exerciseId: `ex-${n}`,
  tags,
  correct,
  answer: 'x',
  at: when,
})

describe('summarizeRecent', () => {
  it('liczy zadania i trafność w każdym obszarze', () => {
    const s = summarizeRecent(
      [
        attempt(['present-perfect'], true, at(0, 10)),
        attempt(['present-perfect', 'past-simple'], false, at(0, 9)),
        attempt(['past-simple'], true, at(1)),
        attempt(['passive-voice'], true, at(2)),
      ],
      [],
      catalog,
      now,
    )
    expect(s.fallback).toBe(false)
    const tenses = s.areas[0]!
    expect(tenses).toMatchObject({ kind: 'exercises', area: 'tenses', tasks: 3, correct: 2 })
    expect(tenses.kind === 'exercises' && tenses.topic?.name).toBe('Present Perfect')
    expect(s.areas[1]).toMatchObject({ area: 'grammar', tasks: 1 })
  })

  it('zad. 9 z tagiem gramatycznym idzie do matury', () => {
    const s = summarizeRecent(
      [attempt(['passive-voice', 'key-word-transformations'], true, at(0))],
      [],
      catalog,
      now,
    )
    expect(s.areas).toHaveLength(1)
    expect(s.areas[0]).toMatchObject({ area: 'exam', topic: { tag: 'key-word-transformations' } })
  })

  it('czytanie ma swój obszar, nawet z tagiem gramatycznym', () => {
    const s = summarizeRecent(
      [attempt(['reading-5', 'passive-voice'], true, at(0)), attempt(['reading-5'], false, at(0))],
      [],
      catalog,
      now,
    )
    expect(s.areas).toHaveLength(1)
    expect(s.areas[0]).toMatchObject({ area: 'reading', tasks: 2, topic: { name: 'zad. 5' } })
  })

  it('próba bez znanego tagu trafia do matury bez tematu', () => {
    const s = summarizeRecent([attempt([], false, at(0))], [], catalog, now)
    expect(s.areas[0]).toMatchObject({ area: 'exam', tasks: 1, correct: 0 })
    expect(s.areas[0]).not.toHaveProperty('topic')
  })

  it('przy remisie tematem jest ten świeższy', () => {
    const s = summarizeRecent(
      [attempt(['past-simple'], true, at(0, 11)), attempt(['present-perfect'], true, at(0, 10))],
      [],
      catalog,
      now,
    )
    expect(s.areas[0]).toMatchObject({ topic: { name: 'Past Simple' } })
  })

  it('pomija stare próby, a fiszki liczy osobno', () => {
    const s = summarizeRecent(
      [attempt(['collocations'], true, at(10)), attempt(['passive-voice'], true, at(3))],
      [
        { createdAt: at(1), lastReviewedAt: at(0, 15) },
        { createdAt: at(20), lastReviewedAt: at(0, 8) },
        { createdAt: at(20), lastReviewedAt: null },
      ],
      catalog,
      now,
    )
    expect(s.areas.map((a) => (a.kind === 'words' ? 'words' : a.area))).toEqual([
      'words',
      'grammar',
    ])
    expect(s.areas[0]).toMatchObject({ saved: 1, reviewed: 2, lastAt: at(0, 15) })
  })

  it('bez nauki w tygodniu bierze ostatni dzień nauki', () => {
    const s = summarizeRecent(
      [
        attempt(['passive-voice'], true, at(12, 18)),
        attempt(['passive-voice'], false, at(12, 9)),
        attempt(['past-simple'], true, at(13)),
      ],
      [],
      catalog,
      now,
    )
    expect(s.fallback).toBe(true)
    expect(s.since).toEqual(at(12, 0))
    expect(s.areas).toHaveLength(1)
    expect(s.areas[0]).toMatchObject({ area: 'grammar', tasks: 2, correct: 1 })
  })

  it('trzyma trzy ostatnie próby, od najnowszej', () => {
    const list = [1, 2, 3, 4].map((h) => attempt(['past-simple'], true, at(0, h)))
    const s = summarizeRecent(list, [], catalog, now)
    const a = s.areas[0]!
    expect(a.kind === 'exercises' && a.last.map((x) => x.at.getHours())).toEqual([4, 3, 2])
  })

  it('pusto, gdy nic nie było', () => {
    expect(summarizeRecent([], [], catalog, now).areas).toEqual([])
  })
})
