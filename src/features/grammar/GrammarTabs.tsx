import { Link } from 'react-router'
import type { GrammarTab } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { groupTab } from './groups'

export function GrammarTabs({
  tabs,
  current,
  soon,
}: {
  tabs: GrammarTab[]
  current: string
  soon: (tab: GrammarTab) => boolean
}) {
  return (
    <nav className="itabs tense-tabs" aria-label={pl.grammar.indexTitle}>
      {tabs.map((t, i) => {
        const groupBreak = i > 0 && tabs[i - 1]!.group !== t.group
        const isSoon = soon(t)
        return (
          <Link
            key={t.id}
            to={`/grammar/${t.id}`}
            className={`itab ${groupTab[t.group]}${groupBreak ? ' gb' : ''}${isSoon ? ' soon' : ''}`}
            aria-current={t.id === current ? 'page' : undefined}
            aria-label={isSoon ? pl.grammar.soonTab(t.label_pl) : t.label_pl}
          >
            <b>{t.tab[0]}</b>
            <span>{t.tab[1]}</span>
          </Link>
        )
      })}
    </nav>
  )
}
