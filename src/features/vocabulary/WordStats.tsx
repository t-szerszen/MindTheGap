import { pl } from '../../i18n/pl'
import type { CardState } from '../../lib/srs'
import { accuracy } from '../../lib/srs'

export function WordStats({ word, now }: { word: CardState; now?: Date }) {
  const t = pl.words
  const acc = accuracy(word)
  const parts = word.attempts
    ? [t.attempts(word.attempts), t.accuracy(Math.round((acc ?? 0) * 100)), t.streak(word.streak)]
    : [t.fresh]
  if (now) parts.push(t.due(word.dueAt, now))
  return <p className="note ink word-stats">{parts.join(' · ')}</p>
}
