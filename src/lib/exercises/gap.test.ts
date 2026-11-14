import { describe, expect, it } from 'vitest'
import { countGaps, splitGap } from './gap'

describe('splitGap', () => {
  it('dzieli zdanie na część przed luką, czasownik i resztę', () => {
    expect(splitGap('By the time we arrived, the film ___ (start).')).toEqual({
      before: 'By the time we arrived, the film',
      base: 'start',
      after: '.',
    })
  })

  it('czasownik z przeczeniem w nawiasie', () => {
    expect(splitGap('I ___ (not / see) Tom yesterday.')?.base).toBe('not / see')
  })

  it('luka na początku zdania', () => {
    expect(splitGap('___ (you / ever / be) to London?')).toEqual({
      before: '',
      base: 'you / ever / be',
      after: 'to London?',
    })
  })

  it('zwraca null, gdy luk jest zero albo więcej niż jedna', () => {
    expect(splitGap('No gap here.')).toBeNull()
    expect(splitGap('I ___ (go) and she ___ (stay).')).toBeNull()
    expect(countGaps('I ___ (go) and she ___ (stay).')).toBe(2)
  })
})
