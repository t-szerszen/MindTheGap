import type { TimelineMark } from '../content/schema'
import { pl } from '../i18n/pl'

// geometria jak w projekcie: oś w viewBox 316 szerokości, oś na wysokości Y
const Y = 70
const W = 316
const x = (p: number) => Math.round((12 + p * 280) * 10) / 10
const r1 = (n: number) => Math.round(n * 10) / 10

function cross(cx: number, s = 7) {
  return `M${cx - s} ${Y - s - 1}L${cx + s} ${Y + s - 1}M${cx + s - 1} ${Y - s}L${cx - s + 1} ${Y + s}`
}

function wave(a: number, b: number) {
  let d = `M${a} ${Y}`
  let up = true
  for (let i = a; i < b; i += 12) {
    const e = Math.min(i + 12, b)
    d += `Q${r1((i + e) / 2)} ${up ? Y - 9 : Y + 9} ${e} ${Y}`
    up = !up
  }
  return d
}

function arc(a: number, b: number, h: number) {
  const ya = Y - 9
  const cy = ya - h
  const c1 = a + (b - a) * 0.25
  const c2 = a + (b - a) * 0.75
  const dx = b - c2
  const dy = ya - cy
  const len = Math.hypot(dx, dy)
  const ux = dx / len
  const uy = dy / len
  const s = 9
  const ca = Math.cos(0.5)
  const sa = Math.sin(0.5)
  const p1 = [b - s * (ux * ca - uy * sa), ya - s * (uy * ca + ux * sa)]
  const p2 = [b - s * (ux * ca + uy * sa), ya - s * (uy * ca - ux * sa)]
  return `M${a} ${ya}C${r1(c1)} ${cy} ${r1(c2)} ${cy} ${b} ${ya}M${r1(p1[0]!)} ${r1(p1[1]!)}L${b} ${ya}L${r1(p2[0]!)} ${r1(p2[1]!)}`
}

type Label = { x: number; y: number; text: string; anchor: 'start' | 'middle' | 'end' }
type Pending = { x: number; text: string; side?: 'right' }

// napisy nie mogą na siebie wchodzić: drugi rząd, jeśli się nakładają, i przycięcie do brzegów
function place(labels: Pending[], rows: number[]): Label[] {
  const placed: { from: number; to: number; y: number }[] = []
  return labels.map((l) => {
    const w = l.text.length * 6.3
    let left = l.side === 'right' ? l.x : l.x - w / 2
    let anchor: Label['anchor'] = l.side === 'right' ? 'start' : 'middle'
    let lx = l.x
    if (left < 4) {
      anchor = 'start'
      lx = 4
      left = 4
    } else if (left + w > W - 4) {
      anchor = 'end'
      lx = W - 4
      left = W - 4 - w
    }
    const y =
      rows.find(
        (ry) => !placed.some((p) => p.y === ry && left < p.to + 6 && left + w > p.from - 6),
      ) ?? rows[rows.length - 1]!
    placed.push({ from: left, to: left + w, y })
    return { x: lx, y, text: l.text, anchor }
  })
}

export function Timeline({ now, marks }: { now: number; marks: TimelineMark[] }) {
  const nx = x(now)
  const ev: string[] = []
  const arcs: string[] = []
  const below: Pending[] = []
  const above: Pending[] = []

  for (const m of marks) {
    const a = x(m.from)
    if (m.kind === 'point') {
      ev.push(cross(a))
      below.push({ x: a, text: m.label })
    } else if (m.kind === 'span') {
      const b = x(m.to ?? now)
      ev.push(wave(a, b))
      above.push({ x: (a + b) / 2, text: m.label })
    } else if (m.kind === 'repeat') {
      const b = x(m.to ?? 1)
      const n = Math.max(3, Math.round((b - a) / 42) + 1)
      for (let i = 0; i < n; i++) ev.push(cross(r1(a + ((b - a) * i) / (n - 1)), 6))
      below.push({ x: (a + b) / 2, text: m.label })
    } else {
      ev.push(cross(a))
      arcs.push(arc(a, nx - 4, 30))
      // skutek „teraz” piszemy na prawo od linii TERAZ, jak w projekcie
      above.push({ x: nx + 8, text: m.label, side: 'right' })
    }
  }

  const labels = [...place(below, [98, 112]), ...place(above, [46, 32])]
  const aria = `${pl.tenses.timeline.label}: ${marks.map((m) => m.label).join(', ')}`

  return (
    <svg className="tl" viewBox={`0 0 ${W} 130`} role="img" aria-label={aria}>
      <path className="ax" d="M8 70C90 68 200 72 304 70M296 63L305 70L296 77" />
      <path className="now" d={`M${nx} 28L${nx} 88`} />
      <text className="t-now mid" x={nx} y={20}>
        {pl.tenses.timeline.now}
      </text>
      {arcs.length > 0 && <path className="arc" d={arcs.join('')} />}
      <path className="ev" d={ev.join('')} />
      {labels.map((l, i) => (
        <text key={i} className="t-ev" x={l.x} y={l.y} textAnchor={l.anchor} lang="en">
          {l.text}
        </text>
      ))}
      <text x={6} y={127}>
        {pl.tenses.timeline.past}
      </text>
      <text className="end" x={310} y={127}>
        {pl.tenses.timeline.future}
      </text>
    </svg>
  )
}
