import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { Loading, NoteState } from '../../components/States'
import { pl } from '../../i18n/pl'
import { useAuth } from './useAuth'

// dane użytkownika tylko po zalogowaniu; treści (czasy, tematy) działają bez konta
export function RequireAuth({ children, text }: { children: ReactNode; text?: string }) {
  const { user, ready, configured } = useAuth()
  const location = useLocation()
  if (!ready) return <Loading />
  if (user) return children
  return (
    <NoteState title={pl.auth.gateTitle} color="b" tilt={1} level={1}>
      <p className="small">{configured ? (text ?? pl.auth.gateText) : pl.auth.notConfigured}</p>
      {configured && (
        <p className="note ink" style={{ marginTop: 6, fontSize: 14 }}>
          {pl.auth.closed}
        </p>
      )}
      {configured && (
        <Link
          className="btn btn-primary btn-sm"
          style={{ marginTop: 12 }}
          to="/login"
          state={{ from: location.pathname + location.search }}
        >
          {pl.auth.gateBtn}
        </Link>
      )}
    </NoteState>
  )
}
