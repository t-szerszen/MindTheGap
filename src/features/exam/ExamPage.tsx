import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Card, Sticky } from '../../components/Paper'
import { pl } from '../../i18n/pl'
import { useExercises, useMocks } from '../../lib/content'
import { watchMockResults, type MockResult } from '../../lib/db/mocks'
import { buildMock } from '../../lib/exercises/mock'
import { useAuth } from '../auth/useAuth'

export function ExamPage() {
  const t = pl.exam
  const { user } = useAuth()
  const mocks = useMocks()
  const exercises = useExercises()
  const [results, setResults] = useState<MockResult[]>([])
  // sprawdzam tylko, czy z banku da się złożyć pełny arkusz; losowanie właściwe jest na stronie arkusza
  const canRandom = buildMock(exercises, () => 0.5) !== null

  useEffect(() => {
    if (!user) return
    return watchMockResults(user.uid, setResults)
  }, [user])

  return (
    <div className="sheet ruled page-in">
      <div className="measure stack">
        <header className="stack" style={{ gap: 2 }}>
          <Link className="link-pen back" to="/exercises">
            <Icon name="back" size="s" />
            {pl.exercises.eyebrow}
          </Link>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="h-l">{t.title}</h1>
          <p className="note blue">{t.subtitle}</p>
        </header>

        <Sticky color="m" tilt={-1} tape={{ color: 'y' }} className="exam-random">
          {canRandom ? (
            <Link className="btn btn-primary btn-block" to="/exam/run">
              <Icon name="pencil" />
              {t.random}
            </Link>
          ) : (
            <p className="small">{t.notEnough}</p>
          )}
          <p className="note ink small" style={{ marginTop: 6 }}>
            {t.randomHint}
          </p>
        </Sticky>

        {mocks.length > 0 && (
          <section className="tsec" aria-labelledby="sets-h">
            <h2 id="sets-h" className="h-s">
              {t.sets}
            </h2>
            <ul className="stack writing-list">
              {mocks.map((m, i) => {
                const best = results.filter((r) => r.setId === m.id)
                return (
                  <li key={m.id}>
                    <Card
                      as={Link}
                      to={`/exam/run?set=${m.id}`}
                      tilt={i % 2 ? 1 : -1}
                      className="writing-card"
                    >
                      <span className="h-s">{m.title_pl}</span>
                      {best[0] && (
                        <span className="note ink">
                          {t.result}: {best[0].score} / {best[0].max}
                        </span>
                      )}
                    </Card>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section className="tsec" aria-labelledby="hist-h">
          <h2 id="hist-h" className="h-s">
            {t.history}
          </h2>
          {!user ? (
            <p className="note ink">{t.loginForHistory}</p>
          ) : results.length ? (
            <ul className="stack exam-history">
              {results.map((r) => (
                <li key={r.id} className="row" style={{ justifyContent: 'space-between' }}>
                  <span className="note ink">{t.when(r.at)}</span>
                  <span className="hand exam-score">
                    {r.score} / {r.max} · {t.percent(Math.round((r.score / r.max) * 100))}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="note ink">{t.noHistory}</p>
          )}
        </section>
      </div>
    </div>
  )
}
