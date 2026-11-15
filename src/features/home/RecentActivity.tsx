import { useMemo } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import type { NoteColor } from '../../components/Paper'
import { pl } from '../../i18n/pl'
import type { Attempt } from '../../lib/db/attempts'
import { getTenses, useExercises, useTopics } from '../../lib/content'
import { recentGap, type RecentGap } from '../../lib/exercises/recent'
import {
  summarizeRecent,
  type AreaSummary,
  type ExerciseArea,
  type TagInfo,
  type WordsSummary,
} from '../../lib/exercises/summary'
import { readingTags } from '../../lib/reading/grade'
import { dayKey } from '../../lib/streak'
import { practiceGroup } from '../topics/hub'
import { useAttempts } from '../exercises/useAttempts'
import { useWords } from '../vocabulary/useWords'

const timeFmt = new Intl.DateTimeFormat('pl-PL', { hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' })

// te same kolory co grupy tagów w ćwiczeniach
const areaColor: Record<ExerciseArea | 'words', NoteColor> = {
  tenses: 'b',
  grammar: 'm',
  vocabulary: 'p',
  exam: 'o',
  reading: 'o',
  words: 'y',
}

function when(d: Date, now: Date) {
  const t = pl.home
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (dayKey(d) === dayKey(now)) return t.recentToday(timeFmt.format(d))
  if (dayKey(d) === dayKey(yesterday)) return t.recentYesterday(timeFmt.format(d))
  return dayFmt.format(d)
}

export function RecentActivity() {
  const t = pl.home
  const { words } = useWords()
  const { attempts } = useAttempts()
  const topics = useTopics()
  const catalog = useMemo(() => {
    const c: Record<string, TagInfo> = {}
    for (const x of getTenses()) c[x.id] = { area: 'tenses', name: x.nameEn, en: true }
    for (const x of topics) c[x.id] = { area: practiceGroup(x.category), name: x.title_pl }
    for (const tag of readingTags) c[tag] = { area: 'reading', name: pl.reading.tagName[tag] }
    return c
  }, [topics])
  const now = new Date()
  const s = summarizeRecent(attempts, words, catalog, now)

  return (
    <section className="tsec" aria-labelledby="recent-h">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <h2 id="recent-h" className="h-m">
          {t.recent}
        </h2>
        {s.areas.length > 0 && (
          <p className="note ink">{t.recentSince(s.fallback ? dayFmt.format(s.since) : null)}</p>
        )}
      </div>
      {s.areas.length === 0 ? (
        <p className="note ink">{t.recentEmpty}</p>
      ) : (
        <ul className="recent">
          {s.areas.map((a) =>
            a.kind === 'words' ? (
              <WordsRow key="words" s={a} now={now} />
            ) : (
              <AreaRow key={a.area} s={a} now={now} />
            ),
          )}
        </ul>
      )}
    </section>
  )
}

function AreaRow({ s, now }: { s: AreaSummary<Attempt>; now: Date }) {
  const t = pl.home
  const exercises = useExercises()
  const reading = s.area === 'reading'
  const to = reading
    ? '/reading'
    : s.topic
      ? `/exercises?tags=${encodeURIComponent(s.topic.tag)}`
      : '/exercises'
  // próba z tekstu z lukami ma klucz luki, np. "cloze-1#3"
  const gaps = s.last.flatMap((a) => {
    const ex = exercises.find((e) => e.id === a.exerciseId.split('#')[0])
    const gap = ex && recentGap(ex, a.exerciseId, a.answer)
    return gap ? [{ id: a.id, ok: a.correct, gap }] : []
  })
  return (
    <li className={`recent-area c-${areaColor[s.area]}`}>
      <Link to={to} className="recent-head">
        <span className="grow">
          <span className="recent-top">
            <span className="hand recent-name">
              {pl.exercises.groups[s.area]}
              {reading && s.topic && ` · ${s.topic.name}`}
            </span>
            <span className="note ink recent-at">{when(s.lastAt, now)}</span>
          </span>
          <span className="small recent-stats">
            {t.recentTasks(s.tasks)} · {t.recentGood(Math.round((s.correct / s.tasks) * 100))}
          </span>
          {s.topic && !reading && (
            <span className="note ink recent-topic">
              {t.recentTopic} <span lang={s.topic.en ? 'en' : undefined}>{s.topic.name}</span>
            </span>
          )}
        </span>
        <Icon name="next" size="s" />
      </Link>
      {gaps.length > 0 && (
        <details className="recent-more">
          <summary className="note blue">{t.recentLast}</summary>
          <ul className="recent-gaps">
            {gaps.map((g) => (
              <li key={g.id} className="row" style={{ alignItems: 'baseline', gap: 8 }}>
                <span className={`recent-mark ${g.ok ? 'ok' : 'bad'}`}>
                  <Icon
                    name={g.ok ? 'check' : 'cross'}
                    size="s"
                    label={g.ok ? pl.exercises.good : pl.exercises.bad}
                  />
                </span>
                <Filled gap={g.gap} ok={g.ok} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </li>
  )
}

function WordsRow({ s, now }: { s: WordsSummary; now: Date }) {
  const t = pl.home
  const parts = [
    s.reviewed > 0 && t.recentReviewed(s.reviewed),
    s.saved > 0 && t.recentSaved(s.saved),
  ].filter(Boolean)
  return (
    <li className={`recent-area c-${areaColor.words}`}>
      <Link to={s.reviewed ? '/review' : '/words'} className="recent-head">
        <span className="grow">
          <span className="recent-top">
            <span className="hand recent-name">{pl.nav.words}</span>
            <span className="note ink recent-at">{when(s.lastAt, now)}</span>
          </span>
          <span className="small recent-stats">{parts.join(' · ')}</span>
        </span>
        <Icon name="next" size="s" />
      </Link>
    </li>
  )
}

function Filled({ gap, ok }: { gap: RecentGap; ok: boolean }) {
  const t = pl.home
  return (
    <span className="grow small recent-sentence" lang="en">
      {gap.before && `${gap.before} `}
      <span className="sr-only" lang="pl">
        {t.yourAnswer}
      </span>
      <span className={`recent-given${ok ? '' : ' bad'}`}>{gap.given}</span>
      {!ok && (
        <>
          <span className="sr-only" lang="pl">
            {t.correctForm}
          </span>
          <span className="recent-fix">{gap.expected}</span>
        </>
      )}
      {gap.cue && <span className="ink"> ({gap.cue})</span>}
      {/* "!" czy "." zaraz po luce bez spacji */}
      {gap.after && (/^[.,!?;:]/.test(gap.after) ? gap.after : ` ${gap.after}`)}
    </span>
  )
}
