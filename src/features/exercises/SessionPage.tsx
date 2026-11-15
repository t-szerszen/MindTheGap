import { useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { Button, Progress } from '../../components/Controls'
import { PencilLine } from '../../components/Ink'
import { Sticky } from '../../components/Paper'
import { Loading, NoteState } from '../../components/States'
import type { Exercise, Topic } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { getTense, useExercises, useTopics } from '../../lib/content'
import { addAttempt } from '../../lib/db/attempts'
import { checkAnswer } from '../../lib/exercises/check'
import { buildSession, tagStats, type SessionMode } from '../../lib/exercises/session'
import { useAuth } from '../auth/useAuth'
import { ExerciseItem } from './ExerciseItem'
import { loadSession, saveSession, type SavedSession } from './savedSession'
import { useAttempts } from './useAttempts'

function titleFor(tags: string[], topics: Topic[]) {
  if (tags.length !== 1) return pl.exercises.mixed
  const id = tags[0]!
  return getTense(id)?.nameEn ?? topics.find((t) => t.id === id)?.title_pl ?? pl.exercises.mixed
}

// czeka na próby (do trybu słabych punktów), a potem raz układa serię
export function SessionPage() {
  const [params] = useSearchParams()
  const { attempts, loading } = useAttempts()
  const exercises = useExercises()
  const { key } = useLocation()
  const resume = params.get('resume') === '1'
  const mode: SessionMode = params.get('mode') === 'weak' ? 'weak' : 'random'
  if (loading && mode === 'weak' && !resume) return <Loading />

  const saved = resume ? loadSession() : null
  let initial: SavedSession
  if (saved) initial = saved
  else {
    const tags = params.get('tags')?.split(',').filter(Boolean) ?? []
    const level = Number(params.get('level')) as 1 | 2 | 3
    const ids = buildSession(exercises, {
      tags,
      difficulty: [1, 2, 3].includes(level) ? level : undefined,
      mode,
      count: Number(params.get('n')) || 8,
      stats: tagStats(attempts),
    }).map((e) => e.id)
    initial = { query: params.toString(), ids, values: {}, checked: {} }
  }
  // key z lokacji: „Nowa seria” z tym samym adresem też losuje od nowa
  return <Session key={key} initial={initial} />
}

function Session({ initial }: { initial: SavedSession }) {
  const t = pl.exercises
  const { user } = useAuth()
  const navigate = useNavigate()
  const exercises = useExercises()
  const topics = useTopics()
  const [state, setState] = useState(initial)
  const items = state.ids
    .map((id) => exercises.find((e) => e.id === id))
    .filter((e): e is Exercise => !!e)
  const tags = new URLSearchParams(state.query).get('tags')?.split(',').filter(Boolean) ?? []

  function update(next: SavedSession) {
    setState(next)
    saveSession(next)
  }

  function check(ids: string[]) {
    const checked = { ...state.checked }
    for (const id of ids) {
      const ex = items.find((e) => e.id === id)
      const answer = state.values[id] ?? ''
      if (!ex || !answer.trim() || checked[id]) continue
      checked[id] = true
      if (user)
        addAttempt(user.uid, {
          exerciseId: id,
          tags: ex.tags,
          correct: checkAnswer(ex, answer),
          answer,
        })
    }
    update({ ...state, checked })
  }

  if (!items.length)
    return (
      <div className="sheet ruled page-in">
        <div className="center-note">
          <NoteState title={t.noMatch} color="p">
            <Link className="link-pen" to="/exercises">
              {t.changeSettings}
            </Link>
          </NoteState>
        </div>
      </div>
    )

  const done = items.filter((e) => state.checked[e.id]).length
  const good = items.filter(
    (e) => state.checked[e.id] && checkAnswer(e, state.values[e.id] ?? ''),
  ).length
  const finished = done === items.length

  return (
    <div className="sheet ruled page-in session">
      <div className="measure stack session-in">
        <header className="stack" style={{ gap: 2 }}>
          <p className="eyebrow">{t.sessionEyebrow(items.length)}</p>
          <div className="hdr">
            <h1 className="h-l" lang={tags.length === 1 && getTense(tags[0]!) ? 'en' : undefined}>
              {titleFor(tags, topics)}
            </h1>
            <span className="hand" style={{ fontSize: 24, fontWeight: 700 }}>
              {done}/{items.length}
            </span>
          </div>
          <span style={{ marginTop: 6 }}>
            <Progress value={done / items.length} />
          </span>
        </header>

        <Sticky
          color="b"
          tilt={1}
          tape={{ color: 'p', pos: 'tr' }}
          style={{ marginTop: 18, padding: '14px 14px 12px' }}
        >
          <p className="small">{t.intro}</p>
          <p className="note ink" style={{ fontSize: 14, marginTop: 2 }}>
            {user ? t.introHint : t.notSaved}
          </p>
        </Sticky>

        <ol className="stack ex-list" aria-label={t.eyebrow}>
          {items.map((ex, i) => (
            <ExerciseItem
              key={ex.id}
              ex={ex}
              n={i + 1}
              value={state.values[ex.id] ?? ''}
              checked={!!state.checked[ex.id]}
              onChange={(v) =>
                update({
                  ...state,
                  values: { ...state.values, [ex.id]: v },
                  checked: { ...state.checked, [ex.id]: false },
                })
              }
              onCheck={() => check([ex.id])}
            />
          ))}
        </ol>

        <div className="stack" style={{ gap: 10, marginTop: 22 }}>
          <PencilLine />
          <p className="row" style={{ justifyContent: 'space-between' }}>
            <span className="h-s">{t.result}</span>
            <span className="hand" style={{ fontSize: 24 }}>
              <span className="red" style={{ fontWeight: 700 }}>
                {good}
              </span>{' '}
              {t.checkedOf(done)}
            </span>
          </p>
          {finished ? (
            <>
              <p className="note">{t.finished(good, items.length)}</p>
              <div className="row wrap" style={{ gap: 12 }}>
                <Button
                  variant="primary"
                  onClick={() =>
                    navigate(`/exercises/session?${new URLSearchParams(state.query)}`, {
                      replace: true,
                    })
                  }
                >
                  {t.newSeries}
                </Button>
                <Link className="link-pen" to="/exercises">
                  {t.changeSettings}
                </Link>
              </div>
            </>
          ) : (
            <>
              <Button block onClick={() => check(items.map((e) => e.id))}>
                {t.checkAll}
              </Button>
              <p className="note ink keys-hint">{t.keysHint}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
