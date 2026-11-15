import { describe, expect, it } from 'vitest'
import { swipeAnswer, swipeProgress, swipeThreshold } from './swipe'

describe('swipeThreshold', () => {
  it('rośnie z szerokością karty, ale w granicach', () => {
    expect(swipeThreshold(335)).toBeCloseTo(100.5)
    expect(swipeThreshold(150)).toBe(70)
    expect(swipeThreshold(560)).toBe(130)
  })
})

describe('swipeAnswer', () => {
  it('w prawo za progiem = wiedziałem', () => {
    expect(swipeAnswer(120, 335)).toBe(true)
  })

  it('w lewo za progiem = nie wiedziałem', () => {
    expect(swipeAnswer(-120, 335)).toBe(false)
  })

  it('krótkie przesunięcie nic nie rozstrzyga', () => {
    expect(swipeAnswer(60, 335)).toBeNull()
    expect(swipeAnswer(-60, 335)).toBeNull()
    expect(swipeAnswer(0, 335)).toBeNull()
  })
})

describe('swipeProgress', () => {
  it('ułamek progu ze znakiem, przycięty do -1..1', () => {
    expect(swipeProgress(50, 150)).toBeCloseTo(50 / 70)
    expect(swipeProgress(-300, 335)).toBe(-1)
    expect(swipeProgress(300, 335)).toBe(1)
  })
})
