// 75 -> "01:15"; powyżej godziny minuty dalej rosną (90:00), bo to i tak rzadkość
export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}
