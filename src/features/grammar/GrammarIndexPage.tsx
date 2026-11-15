import { Link } from 'react-router'
import { Scribble } from '../../components/Ink'
import type { GrammarTab } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { useGrammarTabs, useGrammarTopics } from '../../lib/content'
import { GrammarSubnav } from './GrammarSubnav'
import { GrammarTabs } from './GrammarTabs'
import { groupTab } from './groups'

const groups = ['sentences', 'verbs', 'words'] as const

export function GrammarIndexPage() {
  const tabs = useGrammarTabs()
  const views = useGrammarTopics()
  const soon = (t: GrammarTab) => !t.topic && !views.some((v) => v.id === t.id)
  const g = pl.grammar
  return (
    <div className="tense-wrap">
      <div className="sheet ruled page-in tense-sheet">
        <GrammarSubnav current="grammar" />
        <p className="eyebrow">{g.title}</p>
        <h1 className="h-l">{g.indexTitle}</h1>
        <Scribble width={190} />
        <p className="note blue" style={{ marginTop: 4 }}>
          {g.indexHint}
        </p>
        {groups.map((group) => (
          <section key={group} className="tsec" aria-labelledby={`g-${group}`}>
            <h2 id={`g-${group}`} className="h-s row" style={{ gap: 8 }}>
              <i className={`group-dot ${groupTab[group]}`} aria-hidden="true" />
              {g.groupNames[group]}
            </h2>
            <ul className="stack" style={{ marginTop: 4 }}>
              {tabs
                .filter((t) => t.group === group)
                .map((t) => (
                  <li key={t.id}>
                    <Link to={`/grammar/${t.id}`} className="index-row">
                      <span className="hand index-name">{t.label_pl}</span>
                      <span className="note ink">{t.desc_pl}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
      <GrammarTabs tabs={tabs} current="" soon={soon} />
    </div>
  )
}
