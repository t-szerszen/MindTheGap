import type { ChoiceExercise } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { splitBlanks } from '../../lib/exercises/gap'
import { optionOrder } from '../../lib/exercises/order'
import { letters } from './itemInput'
import { CheckRow, Explain, StepsNote, Task, type ItemProps } from './ItemParts'

// wybór A-D: w tekście luki są ponumerowane, a pod tekstem przy każdej luce rząd opcji, jak w arkuszu
export function ChoiceItem({
  ex,
  n,
  get,
  set,
  results,
  onCheck,
}: ItemProps & { ex: ChoiceExercise }) {
  const t = pl.exercises
  const multi = ex.gaps.length > 1
  const key = (i: number) => `${ex.id}#${i + 1}`
  const chosen = (i: number) => {
    const v = get(key(i))
    return v === '' ? null : Number(v)
  }
  const segments = splitBlanks(ex.text)

  return (
    <li className={`ex${results ? ' is-checked' : ''}`}>
      <span className="ex-num" aria-hidden="true">
        {n}.
      </span>
      <div className="ex-main">
        <Task text={t.task.choice(ex.gaps.length)} />
        {ex.title && (
          <p className="h-s ex-title" lang="en">
            {ex.title}
          </p>
        )}
        <div className="ex-text" lang="en">
          {segments.map((seg, i) => (
            <span key={i}>
              <Para text={seg} />
              {i < ex.gaps.length && (
                <GapMark
                  n={multi ? i + 1 : null}
                  text={chosen(i) !== null ? (ex.gaps[i]!.options[chosen(i)!] ?? null) : null}
                  state={results ? (results[i]!.ok ? 'ok' : 'bad') : null}
                />
              )}
            </span>
          ))}
        </div>

        <ol className="stack opt-list">
          {ex.gaps.map((g, i) => {
            const r = results?.[i]
            return (
              <li key={i} className="opt-gap">
                <div className="row wrap opt-row" role="radiogroup" aria-label={t.gapN(i + 1)}>
                  {multi && <span className="hand opt-n">{i + 1}.</span>}
                  {optionOrder(key(i), g.options.length).map((j, pos) => {
                    const o = g.options[j]!
                    const picked = chosen(i) === j
                    const right = !!r && j === g.answer
                    const missed = !!r && picked && !r.ok
                    return (
                      <button
                        key={j}
                        type="button"
                        role="radio"
                        aria-checked={picked}
                        disabled={!!results}
                        className={`opt${picked ? ' on' : ''}${right ? ' right' : ''}${missed ? ' miss' : ''}`}
                        onClick={() => set(key(i), String(j))}
                        lang="en"
                      >
                        <b>{letters[pos]}</b> {o}
                      </button>
                    )
                  })}
                </div>
                {r && (
                  <Explain ok={r.ok}>
                    <StepsNote head={multi ? t.gapN(i + 1) : t.whyGeneric} steps={g.steps} />
                  </Explain>
                )}
              </li>
            )
          })}
        </ol>
        <CheckRow
          results={results}
          canCheck={ex.gaps.some((_, i) => chosen(i) !== null)}
          onCheck={onCheck}
        />
      </div>
    </li>
  )
}

// akapity w tekście zadania oddziela pusta linia
function Para({ text }: { text: string }) {
  const parts = text.split(/\n\n+/)
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {i > 0 && <span className="para-break" />}
          {p}
        </span>
      ))}
    </>
  )
}

function GapMark({
  n,
  text,
  state,
}: {
  n: number | null
  text: string | null
  state: 'ok' | 'bad' | null
}) {
  return (
    <span className={`cgap${state ? ` ${state}` : ''}`}>
      {n !== null && <sup>{n}</sup>}
      {text ?? ' '.repeat(8)}
    </span>
  )
}
