import { describe, expect, it } from 'vitest'
import { isCorrect, normalizeBasic } from '.'
import { toBritish } from './variants'
import { checkLimited, countWords } from './words'

describe('toBritish', () => {
  it('wyrównuje bezpieczne amerykańskie warianty', () => {
    expect(toBritish('favorite color')).toBe('favourite colour')
    expect(toBritish('they organized it')).toBe('they organised it')
    expect(toBritish('traveled to the center')).toBe('travelled to the centre')
    expect(toBritish('the organization')).toBe('the organisation')
  })

  it('nie rusza słów, gdzie pisownia odróżnia znaczenie', () => {
    expect(toBritish('practice')).toBe('practice')
    expect(toBritish('license')).toBe('license')
    expect(toBritish('program')).toBe('program')
    expect(toBritish('meter')).toBe('meter')
    expect(toBritish('humorous')).toBe('humorous')
    expect(toBritish('advise')).toBe('advise')
  })
})

describe('isCorrect z wariantami', () => {
  it('przyjmuje amerykańską pisownię, gdy klucz jest brytyjski', () => {
    expect(isCorrect('realized', ['realised'])).toBe(true)
    expect(isCorrect('Favorite', ['favourite'])).toBe(true)
  })
  it('nie przyjmuje literówki, która tylko wygląda na wariant', () => {
    expect(isCorrect('advize', ['advise'])).toBe(false)
  })
  it('normalizeBasic zostawia pisownię (dla walidatora)', () => {
    expect(normalizeBasic('Realized')).toBe('realized')
  })
})

describe('countWords', () => {
  it('liczy wyrazy bez interpunkcji', () => {
    expect(countWords('Hello, world! It is   a well-known fact.')).toBe(7)
    expect(countWords('')).toBe(0)
    expect(countWords("I don't know.")).toBe(3)
  })
  it('skrót i dzierżawcze s to jeden wyraz (jak w zasadach CKE)', () => {
    expect(countWords("wasn't in working order")).toBe(4)
    expect(countWords('was not in working order')).toBe(5)
    expect(countWords("must've left Peter's")).toBe(3)
  })
})

describe('checkLimited', () => {
  const opts = {
    answers: ['is said to have', 'is said to have been'],
    keyWord: 'SAID',
    maxWords: 5,
  }

  it('poprawna odpowiedź', () => {
    expect(checkLimited('is said to have', opts)).toEqual({ ok: true })
    expect(checkLimited('  Is said to have. ', opts)).toEqual({ ok: true })
  })
  it('brak słowa kluczowego albo zmieniona forma', () => {
    expect(checkLimited('is believed to have', opts)).toEqual({
      ok: false,
      reason: 'key-missing',
    })
    expect(checkLimited('is saying to have', opts)).toEqual({
      ok: false,
      reason: 'key-missing',
    })
  })
  it('za dużo słów', () => {
    expect(checkLimited('is widely said to have been', opts)).toEqual({
      ok: false,
      reason: 'too-long',
    })
  })
  it('zła odpowiedź mimo słowa kluczowego', () => {
    expect(checkLimited('said to have', opts)).toEqual({ ok: false, reason: 'wrong' })
  })
  it('bez słowa kluczowego liczy się tylko limit i klucz', () => {
    const o = { answers: ["wasn't in working order"], maxWords: 4 }
    expect(checkLimited("wasn't in working order", o)).toEqual({ ok: true })
    expect(checkLimited('was not in working order', o)).toEqual({ ok: false, reason: 'too-long' })
  })
  it('pusta odpowiedź', () => {
    expect(checkLimited('  ', opts)).toEqual({ ok: false, reason: 'empty' })
  })
})
