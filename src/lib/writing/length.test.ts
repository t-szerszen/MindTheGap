import { describe, expect, it } from 'vitest'
import { lengthStatus } from './length'

describe('lengthStatus', () => {
  it('progi CKE', () => {
    expect(lengthStatus(0)).toBe('empty')
    expect(lengthStatus(159)).toBe('tooShort')
    expect(lengthStatus(160)).toBe('short')
    expect(lengthStatus(180)).toBe('nearly')
    expect(lengthStatus(200)).toBe('ok')
    expect(lengthStatus(250)).toBe('ok')
    expect(lengthStatus(251)).toBe('long')
    expect(lengthStatus(280)).toBe('long')
    expect(lengthStatus(281)).toBe('tooLong')
  })
})
