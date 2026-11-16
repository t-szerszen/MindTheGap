import { describe, expect, it } from 'vitest'
import { answerVariants, checkSpelling, distance } from './spelling'

describe('distance', () => {
  it('liczy wstawienia, usunięcia i zamiany', () => {
    expect(distance('trip', 'trip')).toBe(0)
    expect(distance('recieve', 'receive')).toBe(2)
    expect(distance('acommodation', 'accommodation')).toBe(1)
    expect(distance('', 'abc')).toBe(3)
  })
})

describe('answerVariants', () => {
  it('dzieli znaczenia po przecinku, średniku i ukośniku', () => {
    expect(answerVariants('wycieczka, podróż')).toEqual([
      'wycieczka, podróż',
      'wycieczka',
      'podróż',
    ])
    expect(answerVariants('trip')).toEqual(['trip'])
  })
})

describe('checkSpelling', () => {
  it('ignoruje wielkość liter, spacje i kropkę na końcu', () => {
    expect(checkSpelling('  Trip. ', 'trip')).toBe('ok')
    expect(checkSpelling('take  part in', 'take part in')).toBe('ok')
  })

  it('różne apostrofy to to samo', () => {
    expect(checkSpelling('it’s up to you', "it's up to you")).toBe('ok')
  })

  it('wystarczy jedno ze znaczeń', () => {
    expect(checkSpelling('podróż', 'wycieczka, podróż')).toBe('ok')
  })

  it('literówka to „prawie”', () => {
    expect(checkSpelling('acommodation', 'accommodation')).toBe('close')
    expect(checkSpelling('trp', 'trip')).toBe('close')
  })

  it('brak ogonków to też „prawie”, a nie błąd', () => {
    expect(checkSpelling('podroz', 'podróż')).toBe('close')
  })

  it('w krótkim słowie dwie litery różnicy to już inne słowo', () => {
    expect(checkSpelling('tap', 'trip')).toBe('wrong')
    expect(checkSpelling('journey', 'trip')).toBe('wrong')
    expect(checkSpelling('', 'trip')).toBe('wrong')
  })
})
