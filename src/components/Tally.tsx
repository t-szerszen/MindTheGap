import type { WeekDay } from '../lib/streak'

// kreski jak na ławce: cztery pionowe i piąta na skos, ostatnia na czerwono, jeśli to dziś
function group(n: number, today: boolean) {
  const xs = [9, 19, 29.5, 39.5]
  const parts = xs
    .slice(0, Math.min(n, 4))
    .map((x, i) => `M${x} ${7 + (i % 2)}L${x + (i % 2 ? -1 : 1)} ${34 - (i % 2)}`)
  if (n >= 5) parts.push('M3 29C16 22 32 17 50 10')
  const last = today ? parts.pop() : ''
  return { d: parts.join(''), t: last ?? '' }
}

export function Tally({ count, today, label }: { count: number; today: boolean; label: string }) {
  const groups: { d: string; t: string }[] = []
  for (let left = count; left > 0; left -= 5) {
    const n = Math.min(5, left)
    groups.push(group(n, today && left <= 5))
  }
  return (
    <div className="row tally-row" role="img" aria-label={label}>
      {groups.map((g, i) => (
        <svg key={i} className="tally" viewBox="0 0 56 40" aria-hidden="true">
          <path d={g.d} />
          {g.t && <path className="today" d={g.t} />}
        </svg>
      ))}
    </div>
  )
}

const names = ['pn', 'wt', 'śr', 'cz', 'pt', 'so', 'nd']

export function Week({ days, label }: { days: WeekDay[]; label: string }) {
  return (
    <div className="week" aria-label={label}>
      {days.map((d, i) => (
        <span
          key={d.key}
          className={['day', d.done && 'done', d.today && 'today', d.future && 'todo']
            .filter(Boolean)
            .join(' ')}
        >
          {names[i]}
        </span>
      ))}
    </div>
  )
}
