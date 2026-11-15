import { describe, expect, it } from 'vitest'
import { countdowns, daysUntil, examDayLabel, parseExams, parseOral, warsawDay } from './countdown'

describe('warsawDay', () => {
  it('bierze datę z Warszawy, nie z UTC', () => {
    // 23:30 UTC 14 listopada to już 00:30 15-go w Polsce (zima, UTC+1)
    expect(warsawDay(new Date('2026-11-14T23:30:00Z'))).toBe('2026-11-15')
    // latem UTC+2
    expect(warsawDay(new Date('2027-05-05T22:30:00Z'))).toBe('2027-05-06')
    expect(warsawDay(new Date('2027-05-05T21:30:00Z'))).toBe('2027-05-05')
  })
})

describe('daysUntil', () => {
  it('liczy dni kalendarzowe', () => {
    expect(daysUntil('2027-05-07', new Date('2027-05-06T08:00:00Z'))).toBe(1)
    expect(daysUntil('2027-05-07', new Date('2027-05-07T20:00:00Z'))).toBe(0)
    expect(daysUntil('2027-05-07', new Date('2027-05-08T06:00:00Z'))).toBe(-1)
  })

  it('zmiana czasu w marcu nie zjada dnia', () => {
    // 27 marca 2027 23:59 w Polsce (CET), w nocy przestawiamy zegarki
    const before = new Date('2027-03-27T22:59:00Z')
    expect(daysUntil('2027-03-28', before)).toBe(1)
    expect(daysUntil('2027-05-07', before)).toBe(41)
    // tuż po północy 28 marca to już kolejny dzień, choć minęła jedna minuta
    expect(daysUntil('2027-05-07', new Date('2027-03-27T23:01:00Z'))).toBe(40)
  })

  it('zmiana czasu w październiku też', () => {
    // 31.10.2026 doba ma 25 godzin
    expect(daysUntil('2026-11-01', new Date('2026-10-30T23:30:00Z'))).toBe(1)
    expect(daysUntil('2027-05-07', new Date('2026-11-15T10:00:00Z'))).toBe(173)
  })
})

describe('parseOral', () => {
  it('przyjmuje tylko termin ustnych', () => {
    expect(parseOral('2027-05-12T10:30')).toEqual({ date: '2027-05-12', time: '10:30' })
    expect(parseOral('2027-05-31T08:00')).toEqual({ date: '2027-05-31', time: '08:00' })
    expect(parseOral('2027-06-01T08:00')).toBeNull()
    expect(parseOral('2027-05-05T08:00')).toBeNull()
    expect(parseOral('')).toBeNull()
    expect(parseOral(null)).toBeNull()
  })
})

describe('parseExams', () => {
  it('domyślnie rozszerzona, śmieci odpadają', () => {
    expect(parseExams(undefined)).toEqual(['extended'])
    expect(parseExams(['oral', 'nope', 'basic'])).toEqual(['basic', 'oral'])
    expect(parseExams([])).toEqual([])
  })
})

describe('countdowns', () => {
  const now = new Date('2026-11-15T10:00:00Z')

  it('najbliższe pierwsze, ustna bez daty na końcu', () => {
    const list = countdowns(['oral', 'extended', 'basic'], null, now)
    expect(list.map((c) => [c.id, c.days])).toEqual([
      ['basic', 172],
      ['extended', 173],
      ['oral', null],
    ])
  })

  it('ustna w ten sam dzień co pisemna: decyduje godzina', () => {
    const list = countdowns(['basic', 'oral'], '2027-05-06T08:00', now)
    expect(list.map((c) => c.id)).toEqual(['oral', 'basic'])
  })

  it('minione idą na koniec', () => {
    const after = new Date('2027-05-10T10:00:00Z')
    const list = countdowns(['basic', 'extended', 'oral'], '2027-05-20T09:00', after)
    expect(list.map((c) => [c.id, c.days])).toEqual([
      ['oral', 10],
      ['extended', -3],
      ['basic', -4],
    ])
  })

  it('pokazuje tylko wybrane', () => {
    expect(countdowns([], null, now)).toEqual([])
    expect(countdowns(['extended'], null, now).map((c) => c.id)).toEqual(['extended'])
  })
})

describe('examDayLabel', () => {
  it('dzień tygodnia się zgadza', () => {
    expect(examDayLabel('2027-05-06', '09:00')).toBe('czw., 6 maja, 9:00')
  })
})
