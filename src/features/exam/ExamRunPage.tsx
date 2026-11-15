import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Button } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { PencilLine } from '../../components/Ink'
import { NoteState } from '../../components/States'
import { pl } from '../../i18n/pl'
import { useExercises, useMocks } from '../../lib/content'
import { addAttempt } from '../../lib/db/attempts'
import { addMockResult } from '../../lib/db/mocks'
import { gradeExercise, partKeys } from '../../lib/exercises/check'
import { buildMock, partsFromIds, total, type MockPart } from '../../lib/exercises/mock'
import { formatClock } from '../../lib/clock'
import { useAuth } from '../auth/useAuth'
import { ExerciseItem } from '../exercises/ExerciseItem'

const TARGET = 30 * 60

export function ExamRunPage() {
  const [params] = useSearchParams()
  const { key } = useLocation()
  const exercises = useExercises()
  const mocks = useMocks()
  const setId = params.get('set')
  const mock = setId ? mocks.find((m) => m.id === setId) : null
  const build = () => (mock ? partsFromIds(mock.exercises, exercises) : buildMock(exercises))
  if (!mock && !buildMock(exercises, () => 0.5))
    return (
      <div className="sheet ruled page-in">
        <div className="center-note">
          <NoteState title={pl.exam.notEnough} color="p">
            <Link className="link-pen" to="/exam">
              {pl.exam.back}
            </Link>
          </NoteState>
        </div>
      </div>
    )
  // key z lokacji: „Nowy arkusz” z tym samym adresem losuje od nowa
  return <Run key={key} build={build} setId={mock?.id ?? 'random'} title={mock?.title_pl} />
}

function Run({
  build,
  setId,
  title,
}: {
  build: () => MockPart[] | null
  setId: string
  title?: string
}) {
  const t = pl.exam
  const { user } = useAuth()
  // losowanie raz, przy wejściu: później arkusz się nie zmienia, nawet gdy strona się przerysuje
  const [parts] = useState(() => build() ?? [])
  const [values, setValues] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const get = (k: string) => values[k] ?? ''
  const all = parts.flatMap((p) => p.exercises)
  const max = total(parts)

  useEffect(() => {
    if (done) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [done])

  const empty = all.flatMap(partKeys).filter((k) => !get(k).trim()).length
  const graded = done ? all.flatMap((e) => gradeExercise(e, get)) : []
  const score = graded.filter((r) => r.ok).length

  function finish() {
    if (empty && !confirming) {
      setConfirming(true)
      return
    }
    setDone(true)
    const results = all.flatMap((e) => gradeExercise(e, get).map((r) => ({ r, e })))
    if (!user) return
    for (const { r, e } of results)
      addAttempt(user.uid, { exerciseId: r.key, tags: e.tags, correct: r.ok, answer: get(r.key) })
    addMockResult(user.uid, {
      setId,
      score: results.filter((x) => x.r.ok).length,
      max,
      seconds,
    })
  }

  const summary = done && (
    <p className="h-m exam-summary">
      {t.result}: <span className="red">{score}</span> / {max} ·{' '}
      {t.percent(Math.round((score / max) * 100))}
    </p>
  )

  return (
    <div className="sheet ruled page-in session exam">
      <div className="measure stack session-in">
        <header className="stack" style={{ gap: 2 }}>
          <Link className="link-pen back-link" to="/exam">
            <Icon name="back" size="s" />
            {t.back}
          </Link>
          <p className="eyebrow">{t.eyebrow}</p>
          <div className="hdr">
            <h1 className="h-l">{title ?? t.random}</h1>
            <span className={`hand exam-time${seconds > TARGET ? ' red' : ''}`} aria-label={t.time}>
              {formatClock(seconds)}
            </span>
          </div>
          <p className="note ink small">{t.timeHint}</p>
          {summary}
        </header>

        {parts.map((p) => (
          <section key={p.task} className="tsec" aria-labelledby={`task-${p.task}`}>
            <h2 id={`task-${p.task}`} className="h-s">
              {t.task(p.task)} <span className="note ink">· {t.taskName[p.task]}</span>
            </h2>
            <ol className="stack ex-list">
              {p.exercises.map((ex, i) => (
                <ExerciseItem
                  key={ex.id}
                  ex={ex}
                  n={i + 1}
                  get={get}
                  set={(k, v) => !done && setValues((prev) => ({ ...prev, [k]: v }))}
                  results={done ? gradeExercise(ex, get) : null}
                />
              ))}
            </ol>
          </section>
        ))}

        <div className="stack" style={{ gap: 10, marginTop: 22 }}>
          <PencilLine />
          {done ? (
            <>
              {summary}
              <Link className="btn btn-primary" to="/exam/run" replace>
                {t.again}
              </Link>
            </>
          ) : (
            <>
              {confirming && <p className="note red">{t.confirmEmpty(empty)}</p>}
              <Button variant="primary" block onClick={finish}>
                {t.finish}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
