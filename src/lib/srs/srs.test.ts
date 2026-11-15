import { describe, expect, it } from 'vitest'
import { DAY_MS, INTERVAL_DAYS } from './constants'
import {
  accuracy,
  dueCards,
  intervalDays,
  isDue,
  isLeech,
  leeches,
  newCard,
  nextDue,
  review,
  type CardState,
} from './index'

const now = new Date('2026-11-14T10:00:00Z')
const days = (d: Date) => (d.getTime() - now.getTime()) / DAY_MS

function card(patch: Partial<CardState> = {}): CardState {
  return { ...newCard(now), ...patch }
}

describe('newCard', () => {
  it('startuje z pudełka 1, bez statystyk i od razu do powtórki', () => {
    const c = newCard(now)
    expect(c).toEqual({
      box: 1,
      dueAt: now,
      attempts: 0,
      correct: 0,
      lapses: 0,
      streak: 0,
      lastReviewedAt: null,
    })
    expect(isDue(c, now)).toBe(true)
  })
})

describe('review: dobrze', () => {
  it('pudełko w górę, seria, próby i trafienia rosną', () => {
    const r = review(card(), true, now)
    expect(r.box).toBe(2)
    expect(r.streak).toBe(1)
    expect(r.attempts).toBe(1)
    expect(r.correct).toBe(1)
    expect(r.lapses).toBe(0)
    expect(r.lastReviewedAt).toEqual(now)
  })

  it('następna powtórka po interwale nowego pudełka', () => {
    expect(days(review(card({ box: 1 }), true, now).dueAt)).toBe(3)
    expect(days(review(card({ box: 2 }), true, now).dueAt)).toBe(7)
    expect(days(review(card({ box: 4 }), true, now).dueAt)).toBe(30)
  })

  it('nie wychodzi ponad pudełko 5', () => {
    const r = review(card({ box: 5 }), true, now)
    expect(r.box).toBe(5)
    expect(days(r.dueAt)).toBe(30)
  })

  it('cała droga od nowego słówka do pudełka 5', () => {
    let c = card()
    const boxes: number[] = []
    for (let i = 0; i < 6; i++) {
      c = review(c, true, now)
      boxes.push(c.box)
    }
    expect(boxes).toEqual([2, 3, 4, 5, 5, 5])
    expect(c.streak).toBe(6)
  })
})

describe('review: źle', () => {
  it('powrót do pudełka 1, wpadka, seria od zera, powtórka jutro', () => {
    const r = review(card({ box: 4, streak: 3, attempts: 3, correct: 3 }), false, now)
    expect(r.box).toBe(1)
    expect(r.lapses).toBe(1)
    expect(r.streak).toBe(0)
    expect(r.attempts).toBe(4)
    expect(r.correct).toBe(3)
    expect(days(r.dueAt)).toBe(1)
  })

  it('nie zmienia oryginału', () => {
    const c = card({ box: 3 })
    review(c, false, now)
    expect(c.box).toBe(3)
  })
})

describe('intervalDays', () => {
  it('interwały z pliku stałych, poza zakresem przycięte', () => {
    expect([1, 2, 3, 4, 5].map(intervalDays)).toEqual([...INTERVAL_DAYS])
    expect(intervalDays(0)).toBe(1)
    expect(intervalDays(9)).toBe(30)
  })
})

describe('isLeech', () => {
  it('trzy wpadki to uciekinier', () => {
    let c = card()
    c = review(c, false, now)
    c = review(c, false, now)
    expect(isLeech(c)).toBe(false)
    c = review(c, false, now)
    expect(c.lapses).toBe(3)
    expect(isLeech(c)).toBe(true)
  })

  it('słaba skuteczność po co najmniej 5 próbach', () => {
    expect(isLeech({ attempts: 5, correct: 2, lapses: 2 })).toBe(true)
    expect(isLeech({ attempts: 5, correct: 3, lapses: 2 })).toBe(false)
    expect(isLeech({ attempts: 4, correct: 0, lapses: 2 })).toBe(false)
  })
})

describe('kolejki', () => {
  const a = { ...card({ dueAt: new Date(now.getTime() - DAY_MS) }), id: 'a' }
  const b = { ...card({ dueAt: now }), id: 'b' }
  const c = { ...card({ dueAt: new Date(now.getTime() + 2 * DAY_MS) }), id: 'c' }

  it('do powtórki tylko zaległe, najstarsze pierwsze', () => {
    expect(dueCards([c, b, a], now).map((x) => x.id)).toEqual(['a', 'b'])
    expect(nextDue([a, b, c], now)).toEqual(c.dueAt)
    expect(nextDue([a, b], now)).toBeNull()
  })

  it('uciekinierzy od najgorszej skuteczności', () => {
    const x = { ...card({ attempts: 6, correct: 3, lapses: 3 }), id: 'x' }
    const y = { ...card({ attempts: 5, correct: 1, lapses: 4 }), id: 'y' }
    const ok = { ...card({ attempts: 5, correct: 5 }), id: 'ok' }
    expect(leeches([x, ok, y]).map((w) => w.id)).toEqual(['y', 'x'])
  })

  it('skuteczność bez prób to null', () => {
    expect(accuracy(card())).toBeNull()
    expect(accuracy({ attempts: 4, correct: 3 })).toBe(0.75)
  })
})
