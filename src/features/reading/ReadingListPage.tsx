import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Card } from '../../components/Paper'
import { NoteState } from '../../components/States'
import type { ReadingSet } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { useReadingSets } from '../../lib/content'
import type { Attempt } from '../../lib/db/attempts'
import { itemCount, readingTag, readingTags } from '../../lib/reading/grade'
import { lastReadingScore } from '../../lib/reading/last'
import { useAttempts } from '../exercises/useAttempts'

export function ReadingListPage() {
  const t = pl.reading
  const sets = useReadingSets()
  const { attempts } = useAttempts()
  const groups = readingTags
    .map((tag) => ({ tag, sets: sets.filter((s) => readingTag(s) === tag) }))
    .filter((g) => g.sets.length)

  return (
    <div className="sheet ruled page-in">
      <div className="measure stack">
        <header className="stack" style={{ gap: 2 }}>
          <Link className="link-pen back-link" to="/exercises">
            <Icon name="back" size="s" />
            {pl.exercises.eyebrow}
          </Link>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="h-l">{t.title}</h1>
          <p className="note blue">{t.subtitle}</p>
        </header>
        {!sets.length && <NoteState title={t.empty} color="b" />}
        {groups.map((g) => (
          <section key={g.tag} className="tsec" aria-labelledby={`rg-${g.tag}`}>
            <h2 id={`rg-${g.tag}`} className="h-s">
              {t.groupTitle[g.tag]}
            </h2>
            <p className="note ink">{t.groupHint[g.tag]}</p>
            <ul className="stack writing-list">
              {g.sets.map((s, i) => (
                <SetCard key={s.id} set={s} tilt={i % 2 ? 1 : -1} attempts={attempts} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function SetCard({ set, tilt, attempts }: { set: ReadingSet; tilt: 1 | -1; attempts: Attempt[] }) {
  const t = pl.reading
  const last = lastReadingScore(set.id, attempts)
  return (
    <li>
      <Card as={Link} to={`/reading/${set.id}`} tilt={tilt} className="writing-card">
        <span className="h-s" lang="en">
          {set.title}
        </span>
        <span className="row wrap" style={{ gap: 6 }}>
          {set.texts.map((x, i) => (
            <span key={i} className="tag tg-b">
              {t.genres[x.genre]}
            </span>
          ))}
          <span className="tag">{pl.themes[set.theme]}</span>
          <span className="tag tg-m">
            {t.points(set.tasks.reduce((n, task) => n + itemCount(task), 0))}
          </span>
        </span>
        {last && <span className="note ink small">{t.lastScore(last.good, last.total)}</span>}
      </Card>
    </li>
  )
}
