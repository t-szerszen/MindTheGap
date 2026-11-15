import { DEFAULT_EXAMS, EXAM_IDS, ORAL_RANGE, WRITTEN_EXAMS, type ExamId } from './constants'

export type Countdown =
  | { id: ExamId; date: string; time: string; days: number }
  | { id: ExamId; date: null; time: null; days: null }

const warsawFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// "dziś" w Warszawie, niezależnie od strefy telefonu
export function warsawDay(now: Date) {
  return warsawFmt.format(now)
}

// liczymy dni kalendarzowe przez UTC, więc zmiana czasu w marcu nic nie psuje
function dayNumber(day: string) {
  const [y = 0, m = 1, d = 1] = day.split('-').map(Number)
  return Date.UTC(y, m - 1, d) / 86_400_000
}

export function daysUntil(day: string, now: Date) {
  return dayNumber(day) - dayNumber(warsawDay(now))
}

// "2027-05-12T10:00" z pola datetime-local; poza terminem ustnych = brak daty
export function parseOral(value: string | null | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return null
  const date = value.slice(0, 10)
  if (date < ORAL_RANGE.from || date > ORAL_RANGE.to) return null
  return { date, time: value.slice(11, 16) }
}

export function parseExams(value: unknown): ExamId[] {
  if (!Array.isArray(value)) return DEFAULT_EXAMS
  return EXAM_IDS.filter((id) => value.includes(id))
}

// najbliższe pierwsze, minione na koniec, ustna bez daty na samym dole
export function countdowns(selected: ExamId[], oral: string | null, now: Date): Countdown[] {
  const list: Countdown[] = EXAM_IDS.filter((id) => selected.includes(id)).map((id) => {
    const when = id === 'oral' ? parseOral(oral) : WRITTEN_EXAMS[id]
    if (!when) return { id, date: null, time: null, days: null }
    return { id, ...when, days: daysUntil(when.date, now) }
  })
  const rank = (c: Countdown) =>
    c.days === null
      ? Infinity
      : c.days < 0
        ? 1e9 - c.days
        : c.days * 1e4 + Number(c.time.replace(':', ''))
  return list.sort((a, b) => rank(a) - rank(b))
}

// sama data z kalendarza, więc formatujemy w UTC, żeby strefa telefonu nic nie przesunęła
const labelFmt = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
})

export function examDayLabel(date: string, time: string) {
  return `${labelFmt.format(new Date(`${date}T00:00:00Z`))}, ${time.replace(/^0/, '')}`
}
