import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Card } from '../../components/Paper'
import { NoteState } from '../../components/States'
import { pl } from '../../i18n/pl'
import { useReadingSets } from '../../lib/content'
import { itemCount } from '../../lib/reading/grade'

export function ReadingListPage() {
  const t = pl.reading
  const sets = useReadingSets()
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
        <ul className="stack writing-list">
          {sets.map((s, i) => (
            <li key={s.id}>
              <Card
                as={Link}
                to={`/reading/${s.id}`}
                tilt={i % 2 ? 1 : -1}
                className="writing-card"
              >
                <span className="h-s" lang="en">
                  {s.title}
                </span>
                <span className="row wrap" style={{ gap: 6 }}>
                  <span className="tag tg-b">{t.genres[s.genre]}</span>
                  <span className="tag">{pl.themes[s.theme]}</span>
                  <span className="tag tg-m">
                    {t.points(s.tasks.reduce((n, task) => n + itemCount(task), 0))}
                  </span>
                </span>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
