import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Button, Progress, TagButton } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Card, Sticky, type Tilt } from '../../components/Paper'
import type { Exercise } from '../../content/schema'
import type { IconName } from '../../components/Icon'
import { pl } from '../../i18n/pl'
import { getTenses, useExercises, useTopics } from '../../lib/content'
import { filterExercises, type SessionMode } from '../../lib/exercises/session'
import { useAuth } from '../auth/useAuth'
import { loadSession, sessionProgress } from './savedSession'
import { useAttempts } from './useAttempts'

const counts = [5, 8, 12]
const typeOrder: Exercise['type'][] = [
  'gap-fill',
  'choice',
  'word-formation',
  'key-word-transformation',
]
type ModeCard = { id: 'writing' | 'reading' | 'exam'; to: string; icon: IconName; tilt: Tilt }
const modeCards: ModeCard[] = [
  { id: 'writing', to: '/writing', icon: 'pencil', tilt: -1 },
  { id: 'reading', to: '/reading', icon: 'book', tilt: 1 },
  { id: 'exam', to: '/exam', icon: 'clock', tilt: -1 },
]

export function ExercisesPage() {
  const t = pl.exercises
  const { user } = useAuth()
  const { attempts } = useAttempts()
  const navigate = useNavigate()
  const [mode, setMode] = useState<SessionMode>('random')
  const [tags, setTags] = useState<string[]>([])
  const [level, setLevel] = useState<0 | 1 | 2 | 3>(0)
  const [count, setCount] = useState(8)
  const [types, setTypes] = useState<Exercise['type'][]>([])
  const [saved] = useState(loadSession)

  const exercises = useExercises()
  const topics = useTopics()
  // tylko te czasy i tematy, do których są jakieś zdania
  const tenseChips = useMemo(
    () => getTenses().filter((x) => exercises.some((e) => e.tags.includes(x.id))),
    [exercises],
  )
  const topicChips = useMemo(
    () => topics.filter((x) => exercises.some((e) => e.tags.includes(x.id))),
    [exercises, topics],
  )
  const matching = filterExercises(exercises, tags, level || undefined, types).length
  const presentTypes = typeOrder.filter((ty) => exercises.some((e) => e.type === ty))
  const progress = saved && sessionProgress(saved)

  function toggle(tag: string) {
    setTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]))
  }

  function start() {
    const q = new URLSearchParams()
    if (tags.length) q.set('tags', tags.join(','))
    if (level) q.set('level', String(level))
    if (types.length) q.set('types', types.join(','))
    q.set('mode', mode)
    q.set('n', String(count))
    navigate(`/exercises/session?${q}`)
  }

  return (
    <div className="sheet ruled page-in">
      <div className="measure stack">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1 className="h-l">{t.title}</h1>

        <section className="tsec" aria-labelledby="exam-h">
          <h2 id="exam-h" className="h-s">
            {t.examLike}
          </h2>
          <div className="mode-cards">
            {modeCards.map((c) => (
              <Card key={c.to} as={Link} to={c.to} tilt={c.tilt} className="mode-card">
                <Icon name={c.icon} size="l" />
                <span>
                  <span className="h-s" style={{ display: 'block' }}>
                    {t.cards[c.id].title}
                  </span>
                  <span className="small muted">{t.cards[c.id].sub}</span>
                </span>
              </Card>
            ))}
          </div>
        </section>

        {progress && progress.done < progress.total && (
          <Sticky
            as={Link}
            to="/exercises/session?resume=1"
            color="y"
            tilt={-1}
            tape={{ color: 'p' }}
            className="continue-card"
          >
            <span
              className="row"
              style={{ justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <span className="h-m">{t.continue}</span>
              <span className="hand" style={{ fontSize: 23, fontWeight: 700 }}>
                {progress.done}/{progress.total}
              </span>
            </span>
            <span style={{ display: 'block', margin: '8px 0' }}>
              <Progress value={progress.done / progress.total} />
            </span>
          </Sticky>
        )}

        <Sticky
          color="b"
          tilt={1}
          tape={{ color: 'p', pos: 'tr' }}
          style={{ marginTop: 18, padding: '14px 14px 12px' }}
        >
          <p className="small">{t.intro}</p>
          <p className="note ink" style={{ fontSize: 14, marginTop: 2 }}>
            {t.introHint}
          </p>
        </Sticky>

        <section className="tsec" aria-labelledby="mode-h">
          <h2 id="mode-h" className="h-s">
            {t.mode}
          </h2>
          <div className="row chips">
            {(['random', 'weak'] as const).map((m) => (
              <TagButton key={m} pressed={mode === m} onClick={() => setMode(m)}>
                {t.modes[m]}
              </TagButton>
            ))}
          </div>
          {mode === 'weak' && (
            <p className="note" style={{ marginTop: 6 }}>
              {!user ? t.weakNeedsLogin : attempts.length === 0 ? t.weakEmpty : null}
            </p>
          )}
        </section>

        <section className="tsec" aria-labelledby="tags-h">
          <h2 id="tags-h" className="h-s">
            {t.tenses}
          </h2>
          <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
            <TagButton pressed={tags.length === 0} color="y" onClick={() => setTags([])}>
              {t.all}
            </TagButton>
            {tenseChips.map((x) => (
              <TagButton
                key={x.id}
                pressed={tags.includes(x.id)}
                color="b"
                onClick={() => toggle(x.id)}
              >
                <span lang="en">{x.nameEn}</span>
              </TagButton>
            ))}
          </div>
          {topicChips.length > 0 && (
            <>
              <h3 className="eyebrow" style={{ marginTop: 12 }}>
                {t.topics}
              </h3>
              <div className="row wrap" style={{ gap: 6, marginTop: 6 }}>
                {topicChips.map((x) => (
                  <TagButton
                    key={x.id}
                    pressed={tags.includes(x.id)}
                    color="m"
                    onClick={() => toggle(x.id)}
                  >
                    {x.title_pl}
                  </TagButton>
                ))}
              </div>
            </>
          )}
        </section>

        {presentTypes.length > 1 && (
          <section className="tsec" aria-labelledby="types-h">
            <h2 id="types-h" className="h-s">
              {t.types}
            </h2>
            <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>
              <TagButton pressed={!types.length} color="y" onClick={() => setTypes([])}>
                {t.all}
              </TagButton>
              {presentTypes.map((ty) => (
                <TagButton
                  key={ty}
                  pressed={types.includes(ty)}
                  color="p"
                  onClick={() =>
                    setTypes(types.includes(ty) ? types.filter((x) => x !== ty) : [...types, ty])
                  }
                >
                  {t.typeNames[ty]}
                </TagButton>
              ))}
            </div>
          </section>
        )}

        <section className="tsec" aria-labelledby="level-h">
          <h2 id="level-h" className="h-s">
            {t.level}
          </h2>
          <div className="row chips">
            {([0, 1, 2, 3] as const).map((l) => (
              <TagButton key={l} pressed={level === l} onClick={() => setLevel(l)}>
                {t.levels[l]}
              </TagButton>
            ))}
          </div>
        </section>

        <section className="tsec" aria-labelledby="count-h">
          <h2 id="count-h" className="h-s">
            {t.count}
          </h2>
          <div className="row chips">
            {counts.map((c) => (
              <TagButton key={c} pressed={count === c} onClick={() => setCount(c)}>
                {String(c)}
              </TagButton>
            ))}
          </div>
        </section>

        <div className="tsec stack" style={{ gap: 6 }}>
          <p className="note ink">{matching ? t.matching(matching) : t.noMatch}</p>
          <Button variant="primary" block disabled={!matching} onClick={start}>
            <Icon name="pencil" />
            {t.start}
          </Button>
          {user && (
            <Link className="link-pen" to="/exercises/progress" style={{ alignSelf: 'center' }}>
              <Icon name="chart" size="s" />
              {t.progressLink}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
