import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { Button, LineField } from '../../components/Controls'
import { Scribble } from '../../components/Ink'
import { Sticky } from '../../components/Paper'
import { pl } from '../../i18n/pl'
import { authErrorCode, resetPassword, signIn } from '../../lib/db/auth'
import { useAuth } from './useAuth'

export function LoginPage() {
  const { user, configured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const t = pl.auth

  if (user && !busy) return <Navigate to={from} replace />

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    try {
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(t.errors[authErrorCode(err)] ?? t.unknownError)
    } finally {
      setBusy(false)
    }
  }

  async function forgot() {
    setError('')
    setInfo('')
    try {
      await resetPassword(email)
      setInfo(t.resetSent)
    } catch (err) {
      setError(t.errors[authErrorCode(err)] ?? t.unknownError)
    }
  }

  return (
    <div className="sheet squared plain page-in">
      <div className="measure stack" style={{ maxWidth: 460 }}>
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="h-l">{t.loginTitle}</h1>
        <Scribble width={180} />
        <p className="note blue" style={{ marginTop: 6 }}>
          {t.why}
        </p>
        {configured && (
          <p className="small" style={{ marginTop: 10 }}>
            {t.closed}
          </p>
        )}

        {!configured ? (
          <Sticky color="p" tilt={-1} tape={{ color: 'y' }} style={{ marginTop: 24 }}>
            <p className="small">{t.notConfigured}</p>
            <Link className="link-pen" to="/">
              {pl.common.toStart}
            </Link>
          </Sticky>
        ) : (
          <Sticky
            as="form"
            color="b"
            tilt={1}
            tape={{ color: 'p', pos: 'tr' }}
            onSubmit={submit}
            className="stack login-card"
            noValidate
          >
            <LineField
              label={t.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              autoCapitalize="off"
              required
            />
            <LineField
              label={t.password}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <p className="note" aria-live="polite" style={{ minHeight: 21 }}>
              {error || <span className="blue">{info}</span>}
            </p>
            <Button type="submit" variant="primary" block disabled={busy}>
              {busy ? t.busy : t.loginBtn}
            </Button>
            <div className="row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                className="link-pen red"
                onClick={forgot}
                disabled={!email.includes('@')}
              >
                {t.forgot}
              </button>
            </div>
          </Sticky>
        )}
      </div>
    </div>
  )
}
