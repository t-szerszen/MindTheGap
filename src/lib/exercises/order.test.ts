import { describe, expect, it } from 'vitest'
import { optionOrder } from './order'

describe('optionOrder', () => {
  it('to permutacja i dla tego samego ziarna zawsze ta sama', () => {
    const a = optionOrder('lnk-knee#1', 4)
    expect([...a].sort()).toEqual([0, 1, 2, 3])
    expect(optionOrder('lnk-knee#1', 4)).toEqual(a)
  })

  it('poprawna odpowiedź nie ląduje zawsze na A', () => {
    const firsts = new Set<number>()
    for (let i = 0; i < 40; i++) firsts.add(optionOrder(`ex-${i}#1`, 4).indexOf(0))
    expect(firsts.size).toBe(4)
  })
})
