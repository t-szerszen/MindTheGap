import { Icon, type IconName } from '../../components/Icon'
import { pl } from '../../i18n/pl'
import { useExercises } from '../../lib/content'
import { englishSide } from '../../lib/vocab'
import { useAttempts } from '../exercises/useAttempts'
import { useWords } from '../vocabulary/useWords'

const fmt = new Intl.DateTimeFormat('pl-PL', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

type Mark = 'ok' | 'bad' | 'save' | 'review'
type Item = { key: string; at: Date; mark: Mark; text: string }

const icons: Record<Mark, IconName> = { ok: 'check', bad: 'cross', save: 'star', review: 'flip' }

export function RecentActivity() {
  const t = pl.home
  const { words } = useWords()
  const { attempts } = useAttempts()
  const exercises = useExercises()

  const items: Item[] = [
    ...attempts.slice(0, 10).map((a) => ({
      key: `a${a.id}`,
      at: a.at,
      mark: a.correct ? ('ok' as const) : ('bad' as const),
      text:
        exercises.find((e) => e.id === a.exerciseId)?.sentence.replace(/___ \(([^)]+)\)/, '___') ??
        a.exerciseId,
    })),
    ...words.slice(0, 10).map((w) => ({
      key: `w${w.id}`,
      at: w.createdAt,
      mark: 'save' as const,
      text: `${t.savedWord}: ${englishSide(w)}`,
    })),
    ...words
      .filter((w) => w.lastReviewedAt)
      .map((w) => ({
        key: `r${w.id}`,
        at: w.lastReviewedAt!,
        mark: 'review' as const,
        text: `${t.reviewed}: ${englishSide(w)}`,
      })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 5)

  return (
    <section className="tsec" aria-labelledby="recent-h">
      <h2 id="recent-h" className="h-m">
        {t.recent}
      </h2>
      {items.length === 0 ? (
        <p className="note ink">{t.recentEmpty}</p>
      ) : (
        <ul className="recent">
          {items.map((i) => (
            <li key={i.key} className="row" style={{ alignItems: 'baseline', gap: 8 }}>
              <span className={`recent-mark ${i.mark}`}>
                <Icon
                  name={icons[i.mark]}
                  size="s"
                  label={
                    i.mark === 'ok'
                      ? pl.exercises.good
                      : i.mark === 'bad'
                        ? pl.exercises.bad
                        : undefined
                  }
                />
              </span>
              <span className="grow small recent-text" lang="en">
                {i.text}
              </span>
              <span className="note ink recent-at">{fmt.format(i.at)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
