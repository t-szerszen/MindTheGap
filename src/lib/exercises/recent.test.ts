import { describe, expect, it } from 'vitest'
import type { Exercise } from '../../content/schema'
import { recentGap } from './recent'

const steps = [{ label_pl: 'a', text_pl: 'b' }]

const gapFill = {
  id: 'gf',
  type: 'gap-fill',
  sentence: 'By the time we arrived, the film ___ (start).',
  correct: ['had started'],
  steps,
} as unknown as Exercise

const kwt = {
  id: 'kwt',
  type: 'key-word-transformation',
  source: 'I last saw him in May.',
  keyWord: 'SINCE',
  target: "I haven't ___ May.",
  maxWords: 5,
  correct: ['seen him since'],
  steps,
} as unknown as Exercise

const choice = {
  id: 'ch',
  type: 'choice',
  text: '___ by tourists, the lighthouse was old. ___ enough money, the town council finally started the repairs last spring after many long years of waiting. Then it opened.',
  gaps: [
    { options: ['Visiting', 'Visited', 'To visit'], answer: 1, steps },
    { options: ['Raised', 'Having raised', 'Being raised'], answer: 1, steps },
  ],
} as unknown as Exercise

const wf = {
  id: 'wf',
  type: 'word-formation',
  text: 'I had no ___ of dogs. The staff were ___ and kind.',
  gaps: [
    { base: 'KNOW', correct: ['knowledge'], steps },
    { base: 'HELP', correct: ['helpful'], steps },
  ],
} as unknown as Exercise

describe('recentGap', () => {
  it('gap-fill: bez nawiasu z czasownikiem', () => {
    expect(recentGap(gapFill, 'gf', 'started ')).toEqual({
      before: 'By the time we arrived, the film',
      given: 'started',
      after: '.',
      expected: 'had started',
    })
  })

  it('transformacja: zdanie docelowe', () => {
    expect(recentGap(kwt, 'kwt', 'seen him since')).toEqual({
      before: "I haven't",
      given: 'seen him since',
      after: 'May.',
      expected: 'seen him since',
    })
  })

  it('wybór: tekst opcji z indeksu i tylko zdanie z luką, przycięte', () => {
    expect(recentGap(choice, 'ch#1', '0')).toEqual({
      before: '',
      given: 'Visiting',
      after: 'by tourists, the lighthouse was old.',
      expected: 'Visited',
    })
    const second = recentGap(choice, 'ch#2', '1')!
    expect(second.before).toBe('')
    expect(second.given).toBe('Having raised')
    expect(second.after.endsWith('…')).toBe(true)
    expect(second.after.startsWith('enough money, the town')).toBe(true)
  })

  it('słowotwórstwo: wyraz w nawiasie zostaje jako cue', () => {
    expect(recentGap(wf, 'wf#2', 'helpfull')).toEqual({
      before: 'The staff were',
      given: 'helpfull',
      after: 'and kind.',
      expected: 'helpful',
      cue: 'HELP',
    })
  })

  it('inne luki w tym samym zdaniu zostają jako ___', () => {
    const two = { ...wf, text: 'No ___ and no ___ at all.' } as Exercise
    expect(recentGap(two, 'wf#2', 'x')?.before).toBe('No ___ and no')
  })

  it('pusta odpowiedź albo zła luka: null, wtedy zostaje stary opis', () => {
    expect(recentGap(gapFill, 'gf', '')).toBeNull()
    expect(recentGap(choice, 'ch#1', '  ')).toBeNull()
    expect(recentGap(choice, 'ch#5', '1')).toBeNull()
    expect(recentGap(choice, 'ch#1', '9')).toBeNull()
  })
})
