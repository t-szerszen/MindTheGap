import { Suspense } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { pl } from '../i18n/pl'
import { setPrefs, systemIsDark, usePrefs } from '../features/settings/prefs'
import { Icon, type IconName } from './Icon'
import { Hl } from './Ink'
import { Grain } from './Paper'
import { Loading } from './States'

type Section = {
  id: string
  to: string
  label: string
  icon: IconName
  tab: string
  // inne ścieżki, które należą do tej samej przekładki
  also?: string[]
}

const sections: Section[] = [
  { id: 'home', to: '/', label: pl.nav.home, icon: 'home', tab: 'tb-y' },
  { id: 'tenses', to: '/tenses', label: pl.nav.tenses, icon: 'clock', tab: 'tb-b' },
  { id: 'translator', to: '/translator', label: pl.nav.translator, icon: 'talk', tab: 'tb-p' },
  {
    id: 'words',
    to: '/words',
    label: pl.nav.words,
    icon: 'cards',
    tab: 'tb-pres',
    also: ['review', 'leeches'],
  },
  { id: 'exercises', to: '/exercises', label: pl.nav.exercises, icon: 'pencil', tab: 'tb-m' },
  {
    id: 'more',
    to: '/more',
    label: pl.nav.more,
    icon: 'more',
    tab: 'tb-o',
    also: ['topics', 'phrases', 'settings'],
  },
]

function currentSection(pathname: string) {
  const first = pathname.split('/')[1] ?? ''
  if (first === '') return 'home'
  return sections.find((s) => s.to === `/${first}` || s.also?.includes(first))?.id
}

export function Shell() {
  const { pathname } = useLocation()
  const active = currentSection(pathname)
  const { theme } = usePrefs()
  const dark = theme === 'dark' || (theme === 'system' && systemIsDark())

  return (
    <div className="app desk">
      <header className="topbar">
        <p className="logo h-m" lang="en">
          Mind the <Hl>Gap</Hl>
        </p>
        <nav className="toptabs" aria-label={pl.nav.label}>
          {sections.map((s) => (
            <Link
              key={s.id}
              to={s.to}
              className={`ttab ${s.tab}`}
              aria-current={active === s.id ? 'page' : undefined}
            >
              <Icon name={s.icon} size="s" />
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="row" style={{ gap: 4, paddingBottom: 4 }}>
          <button
            type="button"
            className="ibtn"
            aria-label={pl.theme.switchTo(dark ? pl.theme.dark : pl.theme.light)}
            onClick={() => setPrefs({ theme: dark ? 'light' : 'dark' })}
          >
            <Icon name={dark ? 'sun' : 'moon'} />
          </button>
          <Link className="ibtn" to="/settings" aria-label={pl.nav.settings}>
            <Icon name="gear" />
          </Link>
        </div>
      </header>

      <main className="viewport" key={pathname}>
        {/* treści poza czasami ładują się leniwie, pierwsza wizyta na stronie chwilę czeka */}
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>

      <nav className="tabbar" aria-label={pl.nav.label}>
        {sections.map((s) => (
          <Link
            key={s.id}
            to={s.to}
            className={`tab ${s.tab}`}
            aria-current={active === s.id ? 'page' : undefined}
          >
            <Icon name={s.icon} />
            <span>{s.label}</span>
          </Link>
        ))}
      </nav>
      <Grain />
    </div>
  )
}
