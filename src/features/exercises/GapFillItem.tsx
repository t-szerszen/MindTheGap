import { useId } from 'react'
import type { GapFillExercise } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { countWords } from '../../lib/answers/words'
import { getTense } from '../../lib/content'
import { splitGap } from '../../lib/exercises/gap'
import { answerInput } from './itemInput'
import { CheckRow, Explain, StepsNote, Task, type ItemProps } from './ItemParts'

export function GapFillItem({
  ex,
  n,
  get,
  set,
  results,
  onCheck,
}: ItemProps & { ex: GapFillExercise }) {
  const t = pl.exercises
  const id = useId()
  const parts = splitGap(ex.sentence)
  if (!parts) return null
  const value = get(ex.id)
  const r = results?.[0]
  const ok = !!r?.ok
  const wrong = !!r && !r.ok
  const tense = ex.tags.map(getTense).find(Boolean)
  // pole rośnie razem z odpowiedzią, Caveat jest wąski
  const width = `${Math.max(5, value.length * 0.5 + 1.4)}em`

  return (
    <li className={`ex${r ? ' is-checked' : ''}`}>
      <span className="ex-num" aria-hidden="true">
        {n}.
      </span>
      <div className="ex-main">
        {ex.maxWords && <Task text={t.task.words(ex.maxWords)} />}
        <p className="ex-sent" lang="en">
          {parts.before && <span>{parts.before} </span>}
          <label className="sr" htmlFor={id} lang="pl">
            {t.gapLabel(n, parts.base)}
          </label>
          <input
            id={id}
            className={`gap-in${ok ? ' ok' : wrong ? ' bad' : ''}`}
            style={{ width }}
            value={value}
            onChange={(e) => set(ex.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) {
                e.preventDefault()
                onCheck()
              }
            }}
            placeholder="…"
            {...answerInput}
          />
          {wrong && <span className="fix">{ex.correct[0]}</span>}{' '}
          <span className="ex-base">({parts.base})</span>{' '}
          {parts.after && <span>{parts.after}</span>}
        </p>
        {ex.maxWords && !r && value.trim() && (
          <p className={`note ink ex-count${countWords(value) > ex.maxWords ? ' over' : ''}`}>
            {t.wordCount(countWords(value), ex.maxWords)}
          </p>
        )}
        {wrong && r.reason && r.reason !== 'wrong' && (
          <p className="note red">{t.miss[r.reason]}</p>
        )}
        <CheckRow results={results} canCheck={!!value.trim()} onCheck={onCheck} />
      </div>
      {r && (
        <Explain ok={ok}>
          <StepsNote head={tense ? t.why(tense.nameEn) : t.whyGeneric} steps={ex.steps} />
        </Explain>
      )}
    </li>
  )
}
