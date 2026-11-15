import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Card } from '../../components/Paper'
import { pl } from '../../i18n/pl'
import { countdowns, examDayLabel, type Countdown } from '../../lib/exams/countdown'
import { usePrefs } from '../settings/prefs'

function left(c: Countdown) {
  const t = pl.home
  if (c.days === null) return t.examUnset
  if (c.days < 0) return t.examPast
  if (c.days === 0) return t.examToday
  if (c.days === 1) return t.examTomorrow
  return t.examDays(c.days)
}

export function ExamCountdown({ now }: { now: Date }) {
  const { exams, oralAt } = usePrefs()
  const list = countdowns(exams, oralAt, now)
  if (list.length === 0) return null
  const t = pl.home
  return (
    <Card
      as={Link}
      to="/settings"
      variant="index-card"
      tilt={-1}
      tape={{ color: 'b', pos: 'tl' }}
      className="home-card exam-card"
      aria-label={`${t.examsTitle}: ${list.map((c) => `${pl.matura[c.id]} ${left(c)}`).join(', ')}. ${t.examsEdit}`}
    >
      <span className="row" style={{ justifyContent: 'space-between' }}>
        <span className="h-s">{t.examsTitle}</span>
        <Icon name="gear" size="s" />
      </span>
      <span className="exam-rows" aria-hidden="true">
        {list.map((c) => (
          <span
            key={c.id}
            className={`exam-row${c.days !== null && c.days < 0 ? ' past' : ''}${c.days !== null && c.days <= 1 && c.days >= 0 ? ' soon' : ''}`}
          >
            <span className="hand exam-name">{pl.matura[c.id]}</span>
            <span className="exam-dot">·</span>
            <span className={c.days === null ? 'note ink' : 'hand exam-left'}>{left(c)}</span>
            {c.date && <span className="note ink exam-when">{examDayLabel(c.date, c.time)}</span>}
          </span>
        ))}
      </span>
    </Card>
  )
}
