import type { CSSProperties, ReactNode } from 'react'
import type { NoteColor } from './Paper'

export function Hl({
  color = 'y',
  draw,
  delay,
  children,
}: {
  color?: NoteColor
  draw?: boolean
  delay?: number
  children: ReactNode
}) {
  const style = delay ? ({ '--d': `${delay}ms` } as CSSProperties) : undefined
  return (
    <span className={`hl hl-${color}${draw ? ' draw' : ''}`} style={style}>
      {children}
    </span>
  )
}

// podkreślenie pod tytułem; długość w px, kształt zawsze ten sam
export function Scribble({ width = 210, color }: { width?: number; color?: string }) {
  const style = { width, ...(color ? { '--ul': color } : {}) } as CSSProperties
  return (
    <svg className="scribble" viewBox="0 0 220 14" style={style} aria-hidden="true">
      <path d="M3 9C40 4 96 12 150 6S206 5 217 8" />
    </svg>
  )
}

export function PencilLine({ style }: { style?: CSSProperties }) {
  return (
    <svg
      className="pline"
      viewBox="0 0 300 10"
      preserveAspectRatio="none"
      style={style}
      aria-hidden="true"
    >
      <path d="M2 5C80 7 170 3 240 6S290 5 298 5" />
    </svg>
  )
}

const markPaths = {
  tick: 'M8 24C12 27 15 31 18 37C24 24 31 13 40 4',
  cross: 'M8 8C17 17 26 27 37 37M37 7C27 16 17 27 7 38',
}

export function Mark({ ok, label }: { ok: boolean; label: string }) {
  return (
    <svg className="mark" viewBox="0 0 44 44" role="img" aria-label={label}>
      <path d={ok ? markPaths.tick : markPaths.cross} />
    </svg>
  )
}

const doodles = {
  arrow: { box: '0 0 16 16', d: 'M2 8.5C6 8 9 8.3 13 8M10 5l3 3-3 3' },
  down: { box: '0 0 30 22', d: 'M14 2C12.5 8 13.5 13 15 19M10 14.5l5 5.5 5-5' },
  curl: { box: '0 0 30 26', d: 'M26 22C16 22 8 16 6 4M2 9L6 3L11 8' },
  star: {
    box: '0 0 40 40',
    d: 'M20 4L24.5 14.6 35.8 15.6 27.2 23 29.9 34.1 20 28.2 10.2 34.1 12.8 23 4.3 15.6 15.6 14.6z',
  },
}

export function Doodle({
  kind,
  tone,
  className,
  style,
}: {
  kind: keyof typeof doodles
  tone?: 'b' | 'k' | 'g'
  className?: string
  style?: CSSProperties
}) {
  const d = doodles[kind]
  return (
    <svg
      className={['doodle', tone, className].filter(Boolean).join(' ')}
      viewBox={d.box}
      style={style}
      aria-hidden="true"
    >
      <path className={kind === 'star' ? 'fill' : undefined} d={d.d} />
    </svg>
  )
}
