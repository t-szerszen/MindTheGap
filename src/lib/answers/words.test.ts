import { describe, expect, it } from 'vitest'
import { isCorrect, normalizeBasic } from '.'
import { toBritish } from './variants'
import { checkTransformation, countAnswerWords, countWords } from './words'

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
  it('w lukach skrót to dwa wyrazy', () => {
    expect(countAnswerWords("don't have to")).toBe(4)
    expect(countAnswerWords('had better not')).toBe(3)
  })
})

describe('checkTransformation', () => {
  const opts = {
    answers: ['is said to have', 'is said to have been'],
    keyWord: 'SAID',
    maxWords: 5,
  }

  it('poprawna odpowiedź', () => {
    expect(checkTransformation('is said to have', opts)).toEqual({ ok: true })
    expect(checkTransformation('  Is said to have. ', opts)).toEqual({ ok: true })
  })
  it('brak słowa kluczowego albo zmieniona forma', () => {
    expect(checkTransformation('is believed to have', opts)).toEqual({
      ok: false,
      reason: 'key-missing',
    })
    expect(checkTransformation('is saying to have', opts)).toEqual({
      ok: false,
      reason: 'key-missing',
    })
  })
  it('za dużo słów', () => {
    expect(checkTransformation('is widely said to have been', opts)).toEqual({
      ok: false,
      reason: 'too-long',
    })
  })
  it('zła odpowiedź mimo słowa kluczowego', () => {
    expect(checkTransformation('said to have', opts)).toEqual({ ok: false, reason: 'wrong' })
  })
  it('pusta odpowiedź', () => {
    expect(checkTransformation('  ', opts)).toEqual({ ok: false, reason: 'empty' })
  })
})
