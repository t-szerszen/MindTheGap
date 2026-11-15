// na wąskim telefonie 90 px to prawie jedna trzecia karty, na komputerze za mało
const RATIO = 0.3
const MIN_PX = 70
const MAX_PX = 130
// poniżej tego to jeszcze stuknięcie, a nie przeciąganie
export const DRAG_START_PX = 8

export function swipeThreshold(width: number) {
  return Math.min(MAX_PX, Math.max(MIN_PX, width * RATIO))
}

// -1..1, ile brakuje do progu; znak mówi o kierunku
export function swipeProgress(dx: number, width: number) {
  const p = dx / swipeThreshold(width)
  return Math.max(-1, Math.min(1, p))
}

// true = w prawo (wiedziałem), false = w lewo, null = za krótko, karta wraca
export function swipeAnswer(dx: number, width: number): boolean | null {
  if (Math.abs(dx) < swipeThreshold(width)) return null
  return dx > 0
}
