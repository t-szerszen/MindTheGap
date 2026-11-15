import { useId, useState } from 'react'
import { Button } from '../../components/Controls'
import { Mark } from '../../components/Ink'
import type { GapFillExercise } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { getTense } from '../../lib/content'
import { checkAnswer } from '../../lib/exercises/check'
import { splitGap } from '../../lib/exercises/gap'

export type ItemProps = {
  n: number
  value: string
  checked: boolean
  onChange: (v: string) => void
  onCheck: () => void
}

export function GapFillItem({
  ex,
  n,
  value,
  checked,
  onChange,
  onCheck,
}: ItemProps & { ex: GapFillExercise }) {
  const t = pl.exercises
  const id = useId()
  const [showSteps, setShowSteps] = useState(false)
  const parts = splitGap(ex.sentence)
  if (!parts) return null
  const ok = checked && checkAnswer(ex, value)
  const wrong = checked && !ok
  const tense = ex.tags.map(getTense).find(Boolean)
  // pole rośnie razem z odpowiedzią, Caveat jest wąski
  const width = `${Math.max(5, value.length * 0.5 + 1.4)}em`

  return (
    <li className={`ex${checked ? ' is-checked' : ''}`}>
      <span className="ex-num" aria-hidden="true">
        {n}.
      </span>
      <div className="ex-main">
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
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) {
                e.preventDefault()
                onCheck()
              }
            }}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            placeholder="…"
          />
          {wrong && <span className="fix">{ex.correct[0]}</span>}{' '}
          <span className="ex-base">({parts.base})</span>{' '}
          {parts.after && <span>{parts.after}</span>}
        </p>
        {checked && <Mark ok={ok} label={ok ? t.good : t.bad} />}
        {!checked && (
          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 2 }}>
            <Button size="sm" variant="primary" onClick={onCheck} disabled={!value.trim()}>
              {t.check}
            </Button>
          </div>
        )}
      </div>

      {checked && (wrong || showSteps) && (
        <div className="mnote ex-note" aria-live="polite">
          <span className="mhead">{tense ? t.why(tense.nameEn) : t.whyGeneric}</span>
          {ex.steps.map((s, j) => (
            <span key={j} className={`mstep d${j + 1}`}>
              <b>{j + 1}</b>
              <span>
                <span className="mlabel">{s.label_pl}: </span>
                {s.text_pl}
              </span>
            </span>
          ))}
        </div>
      )}
      {ok && (
        <button
          type="button"
          className="link-pen ex-steps-toggle"
          onClick={() => setShowSteps(!showSteps)}
        >
          {showSteps ? t.hideSteps : t.showSteps}
        </button>
      )}
    </li>
  )
}
