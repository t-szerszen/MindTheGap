import { Link } from 'react-router'
import { Scribble } from '../../components/Ink'
import { pl } from '../../i18n/pl'
import { getTenses } from '../../lib/content'
import { TenseTabs } from './TenseTabs'

const groups = ['present', 'past', 'future'] as const
const tab = { present: 'tb-pres', past: 'tb-past', future: 'tb-fut' }

export function TensesIndexPage() {
  const tenses = getTenses()
  const t = pl.tenses
  return (
    <div className="tense-wrap">
      <div className="sheet ruled page-in tense-sheet">
        <p className="eyebrow">{t.title}</p>
        <h1 className="h-l">{t.indexTitle}</h1>
        <Scribble width={170} />
        <p className="note blue" style={{ marginTop: 4 }}>
          {t.indexHint}
        </p>
        {groups.map((g) => (
          <section key={g} className="tsec" aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="h-s row" style={{ gap: 8 }}>
              <i className={`group-dot ${tab[g]}`} aria-hidden="true" />
              {t.groupNames[g]}
            </h2>
            <ul className="stack" style={{ marginTop: 4 }}>
              {tenses
                .filter((x) => x.group === g)
                .map((x) => (
                  <li key={x.id}>
                    <Link to={`/tenses/${x.id}`} className="index-row">
                      <span className="hand index-name" lang="en">
                        {x.nameEn}
                      </span>
                      <span className="note ink">{x.oneLiner_pl}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <TenseTabs tenses={tenses} />
    </div>
  )
}
