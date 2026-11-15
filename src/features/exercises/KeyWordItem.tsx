import { useId } from 'react'
import type { KeyWordExercise } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { countWords } from '../../lib/answers/words'
import { splitBlanks } from '../../lib/exercises/gap'
import { answerInput } from './itemInput'
import { CheckRow, StepsNote, Task, type ItemProps } from './ItemParts'

// transformacja: zdanie wyjściowe, słowo klucz w ramce i drugie zdanie z luką
export function KeyWordItem({
  ex,
  n,
  get,
  set,
  results,
  onCheck,
}: ItemProps & { ex: KeyWordExercise }) {
  const t = pl.exercises
  const id = useId()
  const value = get(ex.id)
  const r = results?.[0]
  const [before, after] = splitBlanks(ex.target)
  const words = countWords(value)

  return (
    <li className={`ex${r ? ' is-checked' : ''}`}>
      <span className="ex-num" aria-hidden="true">
        {n}.
      </span>
      <div className="ex-main">
        <Task text={t.task.keyWord(ex.maxWords)} />
        <p className="ex-sent" lang="en">
          {ex.source}
        </p>
        <p className="kw-key">
          <span className="sr">{t.keyWordLabel}: </span>
          <span lang="en">{ex.keyWord}</span>
        </p>
        <p className="ex-sent" lang="en">
          {before && <span>{before.trimEnd()} </span>}
          <label className="sr" htmlFor={id} lang="pl">
            {t.answerLabel}
          </label>
          <input
            id={id}
            className={`gap-in${r ? (r.ok ? ' ok' : ' bad') : ''}`}
            style={{ width: `${Math.max(7, value.length * 0.5 + 1.4)}em` }}
            value={value}
            onChange={(e) => set(ex.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) {
                e.preventDefault()
                onCheck?.()
              }
            }}
            placeholder="…"
            {...answerInput}
          />
          {r && !r.ok && <span className="fix">{ex.correct[0]}</span>}
          {after && <span> {after.trimStart()}</span>}
        </p>
        {!r && value.trim() && (
          <p className={`note ink ex-count${words > ex.maxWords ? ' over' : ''}`}>
            {t.wordCount(words, ex.maxWords)}
          </p>
        )}
        {r && !r.ok && r.reason && r.reason !== 'wrong' && (
          <p className="note red">{t.miss[r.reason]}</p>
        )}
        <CheckRow results={results} canCheck={!!value.trim()} onCheck={onCheck} />
      </div>
      {r && <StepsNote ok={r.ok} head={r.ok ? t.goodHead() : t.whyGeneric} steps={ex.steps} />}
    </li>
  )
}
