import { describe, expect, it } from 'vitest'
import { formatClock } from './clock'

describe('formatClock', () => {
  it('minuty i sekundy z zerami', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(75)).toBe('01:15')
    expect(formatClock(5400)).toBe('90:00')
    expect(formatClock(-3)).toBe('00:00')
  })
})
