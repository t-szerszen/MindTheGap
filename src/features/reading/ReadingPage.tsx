import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Mark } from '../../components/Ink'
import { NotFound } from '../../components/States'
import type { ReadingSet, ReadingTask } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { countWords } from '../../lib/answers/words'
import { useReadingSets } from '../../lib/content'
import { addAttempt } from '../../lib/db/attempts'
import { gradeReading, itemCount, itemKey } from '../../lib/reading/grade'
import { splitBlanks } from '../../lib/exercises/gap'
import { useAuth } from '../auth/useAuth'
import { answerInput, letters } from '../exercises/itemInput'

export function ReadingPage() {
  const { id = '' } = useParams()
  const set = useReadingSets().find((r) => r.id === id)
  if (!set) return <NotFound />
  // key: przy przejściu do innego tekstu stan zaczyna się od zera
  return <Reading key={set.id} set={set} />
}

function Reading({ set }: { set: ReadingSet }) {
  const t = pl.reading
  const { user } = useAuth()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const get = (k: string) => answers[k] ?? ''
  const results = checked ? gradeReading(set, get) : null
  const ok = (k: string) => results?.find((r) => r.key === k)?.ok
  const total = set.tasks.reduce((n, task) => n + itemCount(task), 0)

  function check() {
    const r = gradeReading(set, get)
    setChecked(true)
    if (user)
      for (const x of r)
        addAttempt(user.uid, {
          exerciseId: `${set.id}#${x.key}`,
          tags: set.tags ?? [],
          correct: x.ok,
          answer: get(x.key),
        })
  }

  // luki w tekście (wstawianie zdań) numeruję po kolei przez wszystkie akapity
  const insertTask = set.tasks.findIndex((x) => x.kind === 'sentence-insert')
  let blank = 0

  return (
    <div className="sheet ruled page-in reading">
      <div className="measure stack">
        <header className="stack" style={{ gap: 2 }}>
          <Link className="link-pen back" to="/reading">
            <Icon name="back" size="s" />
            {t.back}
          </Link>
          <p className="eyebrow">
            {t.genres[set.genre]} · {pl.themes[set.theme]} · {t.points(total)}
          </p>
          <h1 className="h-l" lang="en">
            {set.title}
          </h1>
        </header>

        <article className="reading-text" lang="en">
          {set.paragraphs.map((p, i) => (
            <p key={i} className={p.key ? 'keyed' : undefined}>
              {p.key && <span className="para-key hand">{p.key}</span>}
              {splitBlanks(p.text).map((seg, j, all) => {
                if (j === all.length - 1) return <span key={j}>{seg}</span>
                const n = blank++
                const key = itemKey(insertTask, n)
                const v = get(key)
                return (
                  <span key={j}>
                    {seg}
                    <span className={`cgap${checked ? (ok(key) ? ' ok' : ' bad') : ''}`}>
                      <sup>{n + 1}</sup>
                      {v || ' '.repeat(8)}
                    </span>
                  </span>
                )
              })}
            </p>
          ))}
        </article>

        {set.tasks.map((task, ti) => (
          <section key={ti} className="tsec reading-task" aria-labelledby={`task-${ti}`}>
            <h2 id={`task-${ti}`} className="h-s">
              {t.taskN(ti + 1)}
            </h2>
            <p className="eyebrow ex-task">{instruction(task)}</p>
            <TaskBody
              task={task}
              ti={ti}
              get={get}
              set={(k, v) => !checked && setAnswers((prev) => ({ ...prev, [k]: v }))}
              checked={checked}
              ok={ok}
            />
          </section>
        ))}

        <div className="stack" style={{ gap: 8, marginTop: 18 }}>
          {results ? (
            <>
              <p className="h-m">{t.score(results.filter((r) => r.ok).length, results.length)}</p>
              <Button
                onClick={() => {
                  setAnswers({})
                  setChecked(false)
                }}
              >
                {t.again}
              </Button>
            </>
          ) : (
            <Button variant="primary" block onClick={check} disabled={!Object.keys(answers).length}>
              {t.check}
            </Button>
          )}
          {!user && <p className="note ink small">{t.notSaved}</p>}
        </div>
      </div>
    </div>
  )
}

function instruction(task: ReadingTask) {
  const t = pl.reading.task
  switch (task.kind) {
    case 'sentence-insert':
      return t['sentence-insert'](task.sentences.length - task.answers.length)
    case 'gap':
      return t.gap(task.maxWords)
    default:
      return t[task.kind]
  }
}

type BodyProps = {
  task: ReadingTask
  ti: number
  get: (k: string) => string
  set: (k: string, v: string) => void
  checked: boolean
  ok: (k: string) => boolean | undefined
}

function TaskBody({ task, ti, get, set, checked, ok }: BodyProps) {
  const t = pl.reading
  switch (task.kind) {
    case 'mc':
      return (
        <ol className="stack reading-items">
          {task.items.map((it, i) => {
            const k = itemKey(ti, i)
            return (
              <Item
                key={i}
                n={i + 1}
                k={k}
                checked={checked}
                ok={ok(k)}
                why={it.why_pl}
                extra={it.distractors_pl}
              >
                <p lang="en">{it.question}</p>
                <Options
                  labels={it.options.map((o, j) => `${letters[j]} ${o}`)}
                  values={it.options.map((_, j) => String(j))}
                  value={get(k)}
                  right={checked ? String(it.answer) : null}
                  onPick={(v) => set(k, v)}
                />
              </Item>
            )
          })}
        </ol>
      )
    case 'paragraph-match':
    case 'match': {
      const keys =
        task.kind === 'match'
          ? task.options.map((o) => o.key)
          : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      return (
        <>
          {task.kind === 'match' && (
            <ul className="stack reading-options" lang="en">
              {task.options.map((o) => (
                <li key={o.key}>
                  <b className="hand">{o.key}</b> {o.text}
                </li>
              ))}
            </ul>
          )}
          <ol className="stack reading-items">
            {task.items.map((it, i) => {
              const k = itemKey(ti, i)
              const text = 'statement' in it ? it.statement : it.prompt
              return (
                <Item key={i} n={i + 1} k={k} checked={checked} ok={ok(k)} why={it.why_pl}>
                  <p lang="en">{text}</p>
                  <Options
                    labels={keys.slice(0, task.kind === 'match' ? keys.length : 4)}
                    values={keys.slice(0, task.kind === 'match' ? keys.length : 4)}
                    value={get(k)}
                    right={checked ? it.answer : null}
                    onPick={(v) => set(k, v)}
                  />
                </Item>
              )
            })}
          </ol>
        </>
      )
    }
    case 'sentence-insert':
      return (
        <>
          <ul className="stack reading-options" lang="en">
            {task.sentences.map((s) => (
              <li key={s.key}>
                <b className="hand">{s.key}</b> {s.text}
              </li>
            ))}
          </ul>
          <ol className="stack reading-items">
            {task.answers.map((a, i) => {
              const k = itemKey(ti, i)
              const keys = task.sentences.map((s) => s.key)
              return (
                <Item key={i} n={i + 1} k={k} checked={checked} ok={ok(k)} why={a.why_pl}>
                  <p className="note ink">{t.gapN(i + 1)}</p>
                  <Options
                    labels={keys}
                    values={keys}
                    value={get(k)}
                    right={checked ? a.answer : null}
                    onPick={(v) => set(k, v)}
                  />
                </Item>
              )
            })}
          </ol>
        </>
      )
    case 'true-false':
      return (
        <ol className="stack reading-items">
          {task.items.map((it, i) => {
            const k = itemKey(ti, i)
            return (
              <Item key={i} n={i + 1} k={k} checked={checked} ok={ok(k)} why={it.why_pl}>
                <p lang="en">{it.statement}</p>
                <Options
                  labels={[
                    `${t.tf.true} · ${t.tfLabel.true}`,
                    `${t.tf.false} · ${t.tfLabel.false}`,
                  ]}
                  values={['true', 'false']}
                  value={get(k)}
                  right={checked ? String(it.answer) : null}
                  onPick={(v) => set(k, v)}
                />
              </Item>
            )
          })}
        </ol>
      )
    case 'gap':
      return (
        <ol className="stack reading-items">
          {task.items.map((it, i) => {
            const k = itemKey(ti, i)
            const [before, after] = splitBlanks(it.sentence)
            const v = get(k)
            return (
              <Item key={i} n={i + 1} k={k} checked={checked} ok={ok(k)} why={it.why_pl}>
                <p lang="en" className="ex-sent">
                  {before}
                  <input
                    className={`gap-in${checked ? (ok(k) ? ' ok' : ' bad') : ''}`}
                    style={{ width: `${Math.max(7, v.length * 0.5 + 1.4)}em` }}
                    value={v}
                    aria-label={t.gapN(i + 1)}
                    readOnly={checked}
                    onChange={(e) => set(k, e.target.value)}
                    {...answerInput}
                  />
                  {checked && !ok(k) && <span className="fix">{it.correct[0]}</span>}
                  {after}
                </p>
                {!checked && v.trim() && (
                  <p className={`note ink ex-count${countWords(v) > task.maxWords ? ' over' : ''}`}>
                    {pl.exercises.wordCount(countWords(v), task.maxWords)}
                  </p>
                )}
              </Item>
            )
          })}
        </ol>
      )
  }
}

function Item({
  n,
  checked,
  ok,
  why,
  extra,
  children,
}: {
  n: number
  k: string
  checked: boolean
  ok: boolean | undefined
  why: string
  extra?: string[]
  children: ReactNode
}) {
  return (
    <li className="reading-item">
      <span className="ex-num" aria-hidden="true">
        {n}.
      </span>
      <div className="ex-main">
        {children}
        {checked && <Mark ok={!!ok} label={ok ? pl.exercises.good : pl.exercises.bad} />}
        {checked && (
          <p className="note reading-why">
            {why}
            {extra?.map((d, i) => (
              <span key={i} className="reading-distractor">
                {d}
              </span>
            ))}
          </p>
        )}
      </div>
    </li>
  )
}

function Options({
  labels,
  values,
  value,
  right,
  onPick,
}: {
  labels: string[]
  values: string[]
  value: string
  right: string | null
  onPick: (v: string) => void
}) {
  return (
    <div className="row wrap opt-row" role="radiogroup">
      {values.map((v, i) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          disabled={right !== null}
          className={`opt${value === v ? ' on' : ''}${right === v ? ' right' : ''}${right !== null && value === v && v !== right ? ' miss' : ''}`}
          onClick={() => onPick(v)}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  )
}
