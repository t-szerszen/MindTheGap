import type { WordFormationExercise } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { splitBlanks } from '../../lib/exercises/gap'
import { answerInput } from './itemInput'
import { CheckRow, Explain, StepsNote, Task, type ItemProps } from './ItemParts'

// słowotwórstwo: pole w miejscu luki, a za nim wyraz bazowy wielkimi literami (albo ramka nad tekstem)
export function WordFormationItem({
  ex,
  n,
  get,
  set,
  results,
  onCheck,
}: ItemProps & { ex: WordFormationExercise }) {
  const t = pl.exercises
  const multi = ex.gaps.length > 1
  const key = (i: number) => `${ex.id}#${i + 1}`
  const segments = splitBlanks(ex.text)

  return (
    <li className={`ex${results ? ' is-checked' : ''}`}>
      <span className="ex-num" aria-hidden="true">
        {n}.
      </span>
      <div className="ex-main">
        <Task
          text={ex.box ? t.task.wordBox(ex.box.length - ex.gaps.length) : t.task.wordFormation}
        />
        {ex.title && (
          <p className="h-s ex-title" lang="en">
            {ex.title}
          </p>
        )}
        {ex.box && (
          <p className="wf-box" aria-label={t.boxLabel} lang="en">
            {ex.box.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </p>
        )}
        <div className="ex-text" lang="en">
          {segments.map((seg, i) => {
            const gap = ex.gaps[i]
            if (!gap) return <span key={i}>{seg}</span>
            const value = get(key(i))
            const r = results?.[i]
            return (
              <span key={i}>
                {seg}
                {multi && <sup className="hand">{i + 1}</sup>}
                <input
                  className={`gap-in${r ? (r.ok ? ' ok' : ' bad') : ''}`}
                  style={{ width: `${Math.max(5, value.length * 0.5 + 1.4)}em` }}
                  value={value}
                  aria-label={t.gapInput(i + 1, ex.box ? '' : gap.base)}
                  onChange={(e) => set(key(i), e.target.value)}
                  placeholder="…"
                  {...answerInput}
                />
                {r && !r.ok && <span className="fix">{gap.correct[0]}</span>}
                {!ex.box && <span className="ex-base"> ({gap.base})</span>}
              </span>
            )
          })}
        </div>
        <CheckRow
          results={results}
          canCheck={ex.gaps.some((_, i) => get(key(i)).trim() !== '')}
          onCheck={onCheck}
        />
      </div>
      {results && (
        <div className="stack" style={{ gap: 4 }}>
          {ex.gaps.map((g, i) => (
            <Explain key={i} ok={results[i]!.ok}>
              <StepsNote
                head={`${multi ? `${t.gapN(i + 1)}: ` : ''}${g.base} → ${g.correct[0]}`}
                steps={g.steps}
              />
            </Explain>
          ))}
        </div>
      )}
    </li>
  )
}
