import { describe, expect, it } from 'vitest'
import { markedError, parseMarked } from './marked'

describe('parseMarked', () => {
  it('zamienia litery na role, a resztę zostawia jako tekst', () => {
    expect(parseMarked('[k:If] + [v:Present Simple]')).toEqual([
      { text: 'If', role: 'signal' },
      { text: ' + ', role: 'neutral' },
      { text: 'Present Simple', role: 'verb' },
    ])
  })

  it('obsługuje sklejone kawałki i tekst na brzegach', () => {
    expect(parseMarked("You [a:must][n:n't] [v:use] phones.")).toEqual([
      { text: 'You ', role: 'neutral' },
      { text: 'must', role: 'aux' },
      { text: "n't", role: 'particle' },
      { text: ' ', role: 'neutral' },
      { text: 'use', role: 'verb' },
      { text: ' phones.', role: 'neutral' },
    ])
    expect(parseMarked('[s:Subject]')).toEqual([{ text: 'Subject', role: 'subject' }])
  })

  it('tekst bez znaczników to jeden kawałek', () => {
    expect(parseMarked('Present S.')).toEqual([{ text: 'Present S.', role: 'neutral' }])
  })
})

describe('markedError', () => {
  it('przepuszcza poprawną notację', () => {
    expect(markedError('[k:If I were you], I [a:would] [v:apologise].')).toBeUndefined()
    expect(markedError('bez znaczników')).toBeUndefined()
  })

  it('łapie nieznane litery, niedomknięte i puste nawiasy', () => {
    expect(markedError('[x:if]')).toMatch(/nieznana/)
    expect(markedError('[k:if + [v:V1]')).toBeDefined()
    expect(markedError('[k:]')).toBeDefined()
    expect(markedError('[v: V1]')).toMatch(/spacja/)
  })
})
