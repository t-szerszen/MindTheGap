import { describe, expect, it } from 'vitest'
import { isCorrect, normalizeAnswer } from './index'

describe('normalizeAnswer', () => {
  it('małe litery, spacje i kropka na końcu', () => {
    expect(normalizeAnswer('  Had   Started. ')).toBe('had started')
  })

  it('różne apostrofy to ten sam znak', () => {
    expect(normalizeAnswer('haven’t seen')).toBe(normalizeAnswer("haven't seen"))
    expect(normalizeAnswer('haven`t seen')).toBe('have not seen')
  })

  it('rozwija jednoznaczne skróty', () => {
    expect(normalizeAnswer("won't have finished")).toBe('will not have finished')
    expect(normalizeAnswer("can't")).toBe('can not')
    expect(normalizeAnswer('cannot')).toBe('can not')
    expect(normalizeAnswer("didn't see")).toBe('did not see')
    expect(normalizeAnswer("'ve been waiting")).toBe('have been waiting')
    expect(normalizeAnswer("'ll be flying")).toBe('will be flying')
    expect(normalizeAnswer("you're")).toBe('you are')
    expect(normalizeAnswer("I'm")).toBe('i am')
  })

  it("'s i 'd zostawia, bo są dwuznaczne", () => {
    expect(normalizeAnswer("'s gone")).toBe("'s gone")
    expect(normalizeAnswer("'d left")).toBe("'d left")
  })
})

describe('isCorrect', () => {
  const answers = ["haven't finished", 'have not finished']

  it('akceptuje każdą wersję z listy, w skrócie i bez', () => {
    expect(isCorrect("haven't finished", answers)).toBe(true)
    expect(isCorrect('have not finished', answers)).toBe(true)
    expect(isCorrect('HAVEN’T FINISHED', answers)).toBe(true)
    expect(isCorrect("won't have finished", ['will not have finished'])).toBe(true)
  })

  it('odrzuca złą formę i pustą odpowiedź', () => {
    expect(isCorrect("didn't finish", answers)).toBe(false)
    expect(isCorrect('   ', answers)).toBe(false)
    expect(isCorrect('', [''])).toBe(false)
  })

  it("'s działa tylko, jeśli jest w accepted", () => {
    expect(isCorrect("'s gone", ['has gone'])).toBe(false)
    expect(isCorrect("'s gone", ['has gone', "'s gone"])).toBe(true)
  })
})
