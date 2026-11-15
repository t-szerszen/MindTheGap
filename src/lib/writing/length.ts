// progi z zasad oceniania CKE: poniżej 160 wyrazów liczy się tylko zgodność z poleceniem,
// punkt za długość jest przy 180-280, a polecenie mówi 200-250
export type LengthStatus = 'empty' | 'tooShort' | 'short' | 'nearly' | 'ok' | 'long' | 'tooLong'

export function lengthStatus(words: number): LengthStatus {
  if (words === 0) return 'empty'
  if (words < 160) return 'tooShort'
  if (words < 180) return 'short'
  if (words < 200) return 'nearly'
  if (words <= 250) return 'ok'
  if (words <= 280) return 'long'
  return 'tooLong'
}

// pozycja na pasku 0-1 (pasek kończy się na 320 wyrazach)
export const lengthBarMax = 320
export const lengthPos = (words: number) => Math.min(words, lengthBarMax) / lengthBarMax
