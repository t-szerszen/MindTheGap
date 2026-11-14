import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { pl } from '../i18n/pl'
import { Sticky, type NoteColor, type Tilt } from './Paper'

export function NoteState({
  title,
  children,
  color = 'y',
  tilt = -1,
}: {
  title: string
  children?: ReactNode
  color?: NoteColor
  tilt?: Tilt
}) {
  return (
    <Sticky color={color} tilt={tilt} tape={{ color: 'm' }} className="center-note-card">
      <p className="h-m">{title}</p>
      {children && <div style={{ marginTop: 8 }}>{children}</div>}
    </Sticky>
  )
}

export function Loading() {
  return (
    <p className="note ink" role="status" style={{ padding: '24px 0' }}>
      {pl.common.loading}
    </p>
  )
}

export function NotFound() {
  return (
    <div className="sheet ruled page-in">
      <div className="center-note">
        <NoteState title={pl.common.notFound} color="p">
          <Link className="link-pen" to="/">
            {pl.common.toStart}
          </Link>
        </NoteState>
      </div>
    </div>
  )
}
