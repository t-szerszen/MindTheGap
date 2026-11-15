import { Suspense, useState } from 'react'
import { Link } from 'react-router'
import { Progress } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Doodle } from '../../components/Ink'
import { Card, Sticky } from '../../components/Paper'
import { Tally, Week } from '../../components/Tally'
import { pl } from '../../i18n/pl'
import { dueCards } from '../../lib/srs'
import { currentStreak, dayKey, thisWeek } from '../../lib/streak'
import { polishSide } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { loadSession, sessionProgress } from '../exercises/savedSession'
import { useWords } from '../vocabulary/useWords'
import { Cover } from './Cover'
import { RecentActivity } from './RecentActivity'
import { useActivityDays } from './useActivityDays'

const dateFmt = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })

function ExercisesCard() {
  const t = pl.home
  const [saved] = useState(loadSession)
  const p = saved && sessionProgress(saved)
  const open = p && p.done < p.total
  return (
    <Sticky
      as={Link}
      to={open ? '/exercises/session?resume=1' : '/exercises'}
      color="y"
      tilt={-1}
      tape={{ color: 'p' }}
      className="home-card"
    >
      <span className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="h-m">{open ? t.continue : t.start}</span>
        {open && (
          <span className="hand" style={{ fontSize: 23, fontWeight: 700 }}>
            {p.done}/{p.total}
          </span>
        )}
      </span>
      <span className="small muted" style={{ display: 'block' }}>
        {open ? t.continueSub : t.startSub}
      </span>
      {open && (
        <span style={{ display: 'block', margin: '8px 0' }}>
          <Progress value={p.done / p.total} />
        </span>
      )}
      <span className="row" style={{ justifyContent: 'flex-end', marginTop: 6 }}>
        <span className="btn btn-sm btn-primary">
          {t.next}
          <Icon name="next" size="s" />
        </span>
      </span>
    </Sticky>
  )
}

export function HomePage() {
  const { user, configured } = useAuth()
  const { words } = useWords()
  const days = useActivityDays()
  const t = pl.home
  const now = new Date()
  const due = dueCards(words, now)
  const streak = currentStreak(days, now)
  const doneToday = days.includes(dayKey(now))

  return (
    <div className="home">
      <Cover name={user?.name} />
      <div className="sheet ruled page-in home-sheet">
        <div className="measure stack">
          <div className="hdr">
            <h1 className="h-l">{t.title}</h1>
            <p className="note blue" style={{ paddingBottom: 4 }}>
              {dateFmt.format(now)}
            </p>
          </div>

          <ExercisesCard />

          {user ? (
            <>
              <Card
                as={Link}
                to={due.length ? '/review' : '/words'}
                variant="index-card"
                tilt={1}
                tape={{ color: 'm', pos: 'tr' }}
                className="home-card home-review"
              >
                <span className="row" style={{ justifyContent: 'space-between', height: 34 }}>
                  <span className="h-m">{t.reviewTitle}</span>
                  <span aria-hidden="true" className="mini-deck">
                    <i />
                    <i />
                    <i>{due.length || words.length}</i>
                  </span>
                </span>
                <span
                  className="small"
                  style={{ display: 'block', lineHeight: '28px', marginTop: 4 }}
                >
                  {t.due(due.length)}
                </span>
                <span
                  className="row"
                  style={{ justifyContent: 'space-between', lineHeight: '28px' }}
                >
                  <span className="note blue" style={{ fontSize: 14 }}>
                    {due[0] ? t.example(polishSide(due[0])) : t.saved(words.length)}
                  </span>
                  <span className="link-pen" style={{ minHeight: 40 }}>
                    {t.reviewLink}
                    <Icon name="next" size="s" />
                  </span>
                </span>
              </Card>

              <section className="tsec" aria-labelledby="streak-h">
                <div
                  className="row"
                  style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}
                >
                  <h2 id="streak-h" className="h-m">
                    {t.streak}
                  </h2>
                  <p className="note">{t.streakDays(streak)}</p>
                </div>
                {streak > 0 && (
                  <div className="row" style={{ gap: 2, marginTop: 2 }}>
                    <Tally
                      count={streak}
                      today={doneToday}
                      label={t.tallyLabel(streak, doneToday)}
                    />
                    {doneToday && (
                      <Doodle
                        kind="curl"
                        style={{ width: 40, height: 30, marginLeft: -4, rotate: '200deg' }}
                      />
                    )}
                  </div>
                )}
                <div style={{ marginTop: 4 }}>
                  <Week days={thisWeek(days, now)} label={t.weekLabel} />
                </div>
              </section>

              <Suspense fallback={null}>
                <RecentActivity />
              </Suspense>
            </>
          ) : (
            <>
              <Sticky color="b" tilt={1} tape={{ color: 'y', pos: 'tl' }} className="home-card">
                <p className="h-m">{t.loginTitle}</p>
                <p className="small" style={{ marginTop: 4 }}>
                  {configured ? t.loginText : pl.auth.notConfigured}
                </p>
                {configured && (
                  <Link className="btn btn-sm btn-primary" to="/login" style={{ marginTop: 10 }}>
                    <Icon name="user" size="s" />
                    {pl.auth.loginBtn}
                  </Link>
                )}
              </Sticky>
              <div className="row wrap" style={{ gap: 18, marginTop: 22 }}>
                <Link className="link-pen" to="/tenses/present-perfect">
                  <Icon name="clock" size="s" />
                  {t.goTenses}
                </Link>
                <Link className="link-pen" to="/translator">
                  <Icon name="talk" size="s" />
                  {t.goTranslator}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
