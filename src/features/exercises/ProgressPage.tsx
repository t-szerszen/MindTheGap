import { Link } from 'react-router'
import { Progress } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { Loading, NoteState } from '../../components/States'
import { pl } from '../../i18n/pl'
import { getTenses, useTopics } from '../../lib/content'
import { tagAccuracy, tagStats } from '../../lib/exercises/session'
import type { ExerciseArea } from '../../lib/exercises/summary'
import { readingTags } from '../../lib/reading/grade'
import { practiceGroup, practiceGroups } from '../topics/hub'
import { useAttempts } from './useAttempts'

export function ProgressPage() {
  const t = pl.exercises
  const { attempts, loading } = useAttempts()
  const topics = useTopics()
  if (loading) return <Loading />
  const stats = tagStats(attempts)
  const rows = [
    ...getTenses().map((x) => ({ id: x.id, name: x.nameEn, en: true, group: 'tenses' as const })),
    ...topics.map((x) => ({
      id: x.id,
      name: x.title_pl,
      en: false,
      group: practiceGroup(x.category) as ExerciseArea,
    })),
    ...readingTags.map((id) => ({
      id,
      name: pl.reading.tagName[id],
      en: false,
      group: 'reading' as const,
    })),
  ].filter((r) => stats[r.id])
  const sections = [...practiceGroups, 'reading' as const]
    .map((g) => ({ id: g, rows: rows.filter((r) => r.group === g) }))
    .filter((g) => g.rows.length)
  const good = attempts.filter((a) => a.correct).length

  return (
    <div className="measure stack">
      <Link
        className="link-pen"
        to="/exercises"
        style={{ alignSelf: 'flex-start', marginLeft: -4 }}
      >
        <Icon name="back" size="s" />
        {pl.nav.exercises}
      </Link>
      <h1 className="h-l">{t.progressTitle}</h1>
      <Scribble width={150} />
      <p className="note blue" style={{ marginTop: 4 }}>
        {t.progressHint}
      </p>

      {rows.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <NoteState title={t.progressEmpty} color="m" />
        </div>
      ) : (
        <>
          {sections.map((g) => (
            <section key={g.id} aria-labelledby={`pg-${g.id}`}>
              <h2 id={`pg-${g.id}`} className="eyebrow progress-group">
                {t.groups[g.id]}
              </h2>
              <ul className="stack progress-list">
                {g.rows.map((r) => {
                  const s = stats[r.id]!
                  const acc = tagAccuracy(stats, r.id) ?? 0
                  return (
                    <li key={r.id}>
                      <div
                        className="row"
                        style={{ justifyContent: 'space-between', alignItems: 'baseline' }}
                      >
                        <span className="hand progress-name" lang={r.en ? 'en' : undefined}>
                          {r.name}
                        </span>
                        <span className="hand" style={{ fontSize: 20, fontWeight: 700 }}>
                          {Math.round(acc * 100)}%
                        </span>
                      </div>
                      <Progress value={acc} label={`${r.name}: ${Math.round(acc * 100)}%`} />
                      <p className="note ink" style={{ fontSize: 13 }}>
                        {t.progressRow(s.correct, s.attempts)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
          <p className="small" style={{ marginTop: 16 }}>
            {t.total}: {t.progressRow(good, attempts.length)}
          </p>
          <Link
            className="btn btn-pink"
            to="/exercises/session?mode=weak&n=8"
            style={{ marginTop: 14, alignSelf: 'flex-start' }}
          >
            <Icon name="pencil" />
            {t.practiceWeak}
          </Link>
        </>
      )}
    </div>
  )
}
