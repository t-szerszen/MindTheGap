import { Link } from 'react-router'
import type { Tense } from '../../content/schema'
import { pl } from '../../i18n/pl'

const short = {
  group: { present: 'Pres.', past: 'Past', future: 'Fut.' },
  aspect: {
    simple: 'Simple',
    continuous: 'Cont.',
    perfect: 'Perf.',
    'perfect-continuous': 'Perf. C.',
  },
}
const tab = { present: 'tb-pres', past: 'tb-past', future: 'tb-fut' }

// przekładki na prawym brzegu kartki; kolor = strefa czasu, nie rola w formule
export function TenseTabs({ tenses, current }: { tenses: Tense[]; current?: string }) {
  return (
    <nav className="itabs tense-tabs" aria-label={pl.tenses.indexTitle}>
      {tenses.map((t, i) => {
        const [a, b] = t.tabLabel ?? [short.group[t.group], short.aspect[t.aspect]]
        const groupBreak = i > 0 && tenses[i - 1]!.group !== t.group
        return (
          <Link
            key={t.id}
            to={`/tenses/${t.id}`}
            className={`itab ${tab[t.group]}${groupBreak ? ' gb' : ''}`}
            aria-current={t.id === current ? 'page' : undefined}
            aria-label={t.nameEn}
          >
            <b>{a}</b>
            <span>{b}</span>
          </Link>
        )
      })}
    </nav>
  )
}
