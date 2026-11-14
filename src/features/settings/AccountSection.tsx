import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { pl } from '../../i18n/pl'
import { logOut } from '../../lib/db/auth'
import { useAuth } from '../auth/useAuth'

export function AccountSection() {
  const { user, configured } = useAuth()
  const t = pl.settings
  return (
    <section style={{ marginTop: 26 }} aria-labelledby="acc-h">
      <h2 id="acc-h" className="h-m">
        {t.account}
      </h2>
      {user ? (
        <>
          <div className="row" style={{ gap: 14, marginTop: 12 }}>
            <span aria-hidden="true" className="circ avatar">
              {(user.name || user.email).slice(0, 1).toUpperCase()}
            </span>
            <div className="grow">
              <p className="h-s">{user.name || t.noName}</p>
              <p className="small muted">{pl.auth.signedInAs(user.email)}</p>
            </div>
          </div>
          <div className="row wrap" style={{ gap: 18, marginTop: 12 }}>
            <button type="button" className="link-pen red" onClick={() => logOut()}>
              <Icon name="out" size="s" />
              {pl.auth.logout}
            </button>
          </div>
        </>
      ) : (
        <div className="stack" style={{ gap: 8, marginTop: 8 }}>
          <p className="small muted">{configured ? t.loggedOut : pl.auth.notConfigured}</p>
          {configured && (
            <Link
              className="btn btn-sm btn-primary"
              to="/login"
              style={{ alignSelf: 'flex-start' }}
            >
              <Icon name="user" size="s" />
              {pl.auth.loginBtn}
            </Link>
          )}
        </div>
      )}
    </section>
  )
}
