import { Suspense, useEffect, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { topicHome } from '../features/topics/hub'
import { pl } from '../i18n/pl'
import { topicStore } from '../lib/content'
import { Icon, type IconName } from './Icon'
import { Hl } from './Ink'
import { Grain } from './Paper'
import { Loading } from './States'
import { ThemePill } from './ThemePill'

type Section = {
  id: string
  to: string
  label: string
  icon: IconName
  tab: string
  // inne ścieżki, które należą do tej samej przekładki
  also?: string[]
}

const home: Section = { id: 'home', to: '/', label: pl.nav.home, icon: 'home', tab: 'tb-y' }
const translator: Section = {
  id: 'translator',
  to: '/translator',
  label: pl.nav.translator,
  icon: 'talk',
  tab: 'tb-p',
}
const words: Section = {
  id: 'words',
  to: '/words',
  label: pl.nav.words,
  icon: 'cards',
  tab: 'tb-k',
  also: ['review', 'leeches'],
}
const exercises: Section = {
  id: 'exercises',
  to: '/exercises',
  label: pl.nav.exercises,
  icon: 'pencil',
  tab: 'tb-m',
  also: ['writing', 'reading', 'exam'],
}
const more: Section = {
  id: 'more',
  to: '/more',
  label: pl.nav.more,
  icon: 'dots',
  tab: 'tb-o',
  also: ['topics', 'phrases'],
}

const topSections: Section[] = [
  home,
  { id: 'tenses', to: '/tenses', label: pl.nav.tenses, icon: 'clock', tab: 'tb-b' },
  { id: 'grammar', to: '/grammar', label: pl.nav.grammar, icon: 'book', tab: 'tb-l' },
  translator,
  words,
  exercises,
  more,
]

// na telefonie jest miejsce na 6, więc czasy siedzą w gramatyce (podział na górze strony)
const phoneSections: Section[] = [
  home,
  {
    id: 'grammar',
    to: '/grammar',
    label: pl.nav.grammar,
    icon: 'book',
    tab: 'tb-b',
    also: ['tenses'],
  },
  translator,
  words,
  exercises,
  more,
]

function currentSection(list: Section[], pathname: string) {
  const [, first = '', id] = pathname.split('/')
  if (first === '') return 'home'
  if (first === 'topics' && id) {
    const topic = topicStore.peek()?.find((t) => t.id === id)
    const home = topic && topicHome(topic.category)
    if (home && home !== 'more') return list.some((s) => s.id === home) ? home : 'grammar'
  }
  return list.find((s) => s.to === `/${first}` || s.also?.includes(first))?.id
}

export function Shell() {
  const { pathname } = useLocation()
  const onTopic = pathname.startsWith('/topics/')
  // po odświeżeniu na temacie treść jeszcze się ładuje, a od niej zależy podświetlona przekładka
  const [, setTopicsReady] = useState(false)
  useEffect(() => {
    if (onTopic && !topicStore.peek()) void topicStore.load().then(() => setTopicsReady(true))
  }, [onTopic])
  const activeTop = currentSection(topSections, pathname)
  const activePhone = currentSection(phoneSections, pathname)

  return (
    <div className="app desk">
      <header className="topbar">
        <p className="logo h-m" lang="en">
          Mind the <Hl>Gap</Hl>
        </p>
        <nav className="toptabs tight" aria-label={pl.nav.label}>
          {topSections.map((s) => (
            <Link
              key={s.id}
              to={s.to}
              className={`ttab ${s.tab}`}
              aria-current={activeTop === s.id ? 'page' : undefined}
            >
              <Icon name={s.icon} size="s" />
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="row" style={{ gap: 4, paddingBottom: 4 }}>
          <ThemePill />
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
        {phoneSections.map((s) => (
          <Link
            key={s.id}
            to={s.to}
            className={`tab ${s.tab}`}
            aria-current={activePhone === s.id ? 'page' : undefined}
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
