// seria dni nauki: dzień liczy się, jeśli była choć jedna powtórka, ćwiczenie albo zapisane słówko

export function dayKey(d: Date) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

function shift(d: Date, days: number) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  x.setDate(x.getDate() + days)
  return x
}

// dzisiaj jeszcze nic? seria z wczoraj dalej się liczy, dopóki dzień się nie skończy
export function currentStreak(days: string[], today: Date) {
  const set = new Set(days)
  let d = set.has(dayKey(today)) ? today : shift(today, -1)
  let n = 0
  while (set.has(dayKey(d))) {
    n += 1
    d = shift(d, -1)
  }
  return n
}

export type WeekDay = { key: string; done: boolean; today: boolean; future: boolean }

// tydzień od poniedziałku, jak w polskim kalendarzu
export function thisWeek(days: string[], today: Date): WeekDay[] {
  const set = new Set(days)
  const monday = shift(today, -((today.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = shift(monday, i)
    const key = dayKey(d)
    return { key, done: set.has(key), today: key === dayKey(today), future: d > today }
  })
}
