import { describe, expect, it } from 'vitest'
import { markSignals, signalPhrases } from './signals'

describe('signalPhrases', () => {
  it('rozbija warianty i wyrzuca znaki', () => {
    expect(signalPhrases(['today / this week', 'How long…?', 'Look!', 'never… before'])).toEqual([
      'this week',
      'how long',
      'before',
      'today',
      'never',
      'look',
    ])
  })

  it('pomija bardzo krótkie słowa', () => {
    expect(signalPhrases(['as', 'by', 'for'])).toEqual(['for'])
  })
})

describe('markSignals', () => {
  const phrases = signalPhrases(['since', 'yet', 'this week'])

  it('zaznacza całe słowa bez względu na wielkość liter', () => {
    expect(markSignals("I haven't finished it yet.", phrases)).toEqual([
      { text: "I haven't finished it ", signal: false },
      { text: 'yet', signal: true },
      { text: '.', signal: false },
    ])
    expect(markSignals('Since 2019 we have lived here.', phrases)[0]).toEqual({
      text: 'Since',
      signal: true,
    })
  })

  it('nie łapie kawałków innych słów', () => {
    expect(markSignals('Yesterday I was busy.', phrases)).toEqual([
      { text: 'Yesterday I was busy.', signal: false },
    ])
  })

  it('wyrażenia wielowyrazowe', () => {
    const s = markSignals("We haven't had tests this week.", phrases)
    expect(s.filter((x) => x.signal).map((x) => x.text)).toEqual(['this week'])
  })
})
