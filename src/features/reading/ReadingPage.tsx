import { Fragment, useState, type ReactNode } from 'react'
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
import { gradeReading, itemCount, itemKey, type ReadingResult } from '../../lib/reading/grade'
import { splitBlanks } from '../../lib/exercises/gap'
import { optionOrder } from '../../lib/exercises/order'
import { useAuth } from '../auth/useAuth'
import { answerInput, letters } from '../exercises/itemInput'

type Gap = Extract<ReadingTask, { kind: 'gap' }>

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
  const res = (k: string) => results?.find((r) => r.key === k)
  const total = set.tasks.reduce((n, task) => n + itemCount(task), 0)
  const paraKeys = set.texts.flatMap((x) => x.paragraphs.flatMap((p) => (p.key ? [p.key] : [])))

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
  const insertTi = set.tasks.findIndex((x) => x.kind === 'sentence-insert')
  const insert = set.tasks[insertTi]
  const sentenceOf = (key: string) =>
    insert?.kind === 'sentence-insert' ? insert.sentences.find((s) => s.key === key)?.text : null
  let blank = 0
  // numeracja jak w arkuszu: 6.1–6.8 przez wszystkie zadania zestawu
  const firstNo = set.tasks.map((_, ti) =>
    set.tasks.slice(0, ti).reduce((n, x) => n + itemCount(x), 0),
  )
  const no = (ti: number, i: number) =>
    set.examTask ? `${set.examTask}.${firstNo[ti]! + i + 1}` : String(i + 1)

  return (
    <div className={`sheet ruled page-in reading${set.examTask ? ' exam-no' : ''}`}>
      <div className="measure stack">
        <header className="stack" style={{ gap: 2 }}>
          <Link className="link-pen back-link" to="/reading">
            <Icon name="back" size="s" />
            {t.back}
          </Link>
          <p className="eyebrow">
            {set.examTask ? t.examTask(set.examTask) : t.genres[set.texts[0]!.genre]} ·{' '}
            {pl.themes[set.theme]} · {t.points(total)}
          </p>
          <h1 className="h-l" lang="en">
            {set.title}
          </h1>
        </header>

        {set.texts.map((text, xi) => (
          <section key={xi} className="reading-block" aria-labelledby={`text-${xi}`}>
            {set.texts.length > 1 && (
              <header className="row wrap reading-text-head">
                <h2 id={`text-${xi}`} className="h-s">
                  {t.textN(xi + 1)}
                </h2>
                {text.title && (
                  <span className="hand reading-text-title" lang="en">
                    {text.title}
                  </span>
                )}
                <span className="tag tg-b">{t.genres[text.genre]}</span>
              </header>
            )}
            <article className="reading-text" lang="en">
              {text.paragraphs.map((p, i) => (
                <p key={i} className={p.key ? 'keyed' : undefined}>
                  {p.key && <span className="para-key hand">{p.key}</span>}
                  {splitBlanks(p.text).map((seg, j, all) => {
                    if (j === all.length - 1) return <span key={j}>{seg}</span>
                    const n = blank++
                    const key = itemKey(insertTi, n)
                    const v = get(key)
                    const r = res(key)
                    return (
                      <span key={j}>
                        {seg}
                        <span
                          className={`cgap${v ? ' filled' : ''}${r ? (r.ok ? ' ok' : ' bad') : ''}`}
                        >
                          <sup>{no(insertTi, n)}</sup>
                          {v ? (
                            <>
                              <b className="hand">{v}</b> {sentenceOf(v)}
                            </>
                          ) : (
                            ' '.repeat(8)
                          )}
                        </span>
                      </span>
                    )
                  })}
                </p>
              ))}
            </article>
          </section>
        ))}

        {set.tasks.map((task, ti) => (
          <section key={ti} className="tsec reading-task" aria-labelledby={`task-${ti}`}>
            <h2 id={`task-${ti}`} className="h-s">
              {set.examTask ? t.itemRange(no(ti, 0), no(ti, itemCount(task) - 1)) : t.taskN(ti + 1)}
              {'text' in task && task.text && set.texts.length > 1 && (
                <span className="note ink"> · {t.textN(task.text)}</span>
              )}
            </h2>
            <p className="eyebrow ex-task">{instruction(task)}</p>
            <TaskBody
              setId={set.id}
              task={task}
              ti={ti}
              no={(i) => no(ti, i)}
              paraKeys={paraKeys}
              get={get}
              set={(k, v) => !checked && setAnswers((prev) => ({ ...prev, [k]: v }))}
              checked={checked}
              res={res}
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
  setId: string
  task: ReadingTask
  ti: number
  no: (i: number) => string
  paraKeys: string[]
  get: (k: string) => string
  set: (k: string, v: string) => void
  checked: boolean
  res: (k: string) => ReadingResult | undefined
}

function TaskBody({ setId, task, ti, no, paraKeys, get, set, checked, res }: BodyProps) {
  const t = pl.reading
  const ok = (k: string) => res(k)?.ok
  switch (task.kind) {
    case 'mc':
      return (
        <ol className="stack reading-items">
          {task.items.map((it, i) => {
            const k = itemKey(ti, i)
            // litery wg miejsca na ekranie, wartość to indeks z pliku, więc ocena się nie zmienia
            const order = optionOrder(`${setId}#${k}`, it.options.length)
            const notes = order.flatMap((j, pos) => {
              const note = it.options[j]!.wrong_pl
              return note ? [`${letters[pos]}: ${note}`] : []
            })
            return (
              <Item key={i} n={no(i)} checked={checked} ok={ok(k)} why={it.why_pl} extra={notes}>
                <p lang="en">{it.question}</p>
                <Options
                  labels={order.map((j, pos) => `${letters[pos]} ${it.options[j]!.text}`)}
                  values={order.map(String)}
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
      const keys = task.kind === 'match' ? task.options.map((o) => o.key) : paraKeys
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
                <Item key={i} n={no(i)} checked={checked} ok={ok(k)} why={it.why_pl}>
                  <p lang="en">{text}</p>
                  <Options
                    labels={keys}
                    values={keys}
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
                <Item key={i} n={no(i)} checked={checked} ok={ok(k)} why={a.why_pl}>
                  <p className="note ink">{t.gapN(no(i))}</p>
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
              <Item key={i} n={no(i)} checked={checked} ok={ok(k)} why={it.why_pl}>
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
    case 'gap': {
      const props = { task, ti, no, get, set, checked, res }
      return task.layout === 'summary' ? <GapSummary {...props} /> : <GapList {...props} />
    }
  }
}

type GapProps = Omit<BodyProps, 'task' | 'setId' | 'paraKeys'> & { task: Gap }

// zdania jedno pod drugim; w notatce nad grupą luk jej nagłówek (np. pros / cons)
function GapList({ task, ti, no, get, set, checked, res }: GapProps) {
  const note = task.layout === 'note'
  return (
    <ol className={`stack reading-items${note ? ' reading-note' : ''}`}>
      {task.items.map((it, i) => {
        const k = itemKey(ti, i)
        const [before, after] = splitBlanks(it.sentence)
        const head = note && it.heading !== task.items[i - 1]?.heading
        return (
          <Fragment key={i}>
            {head && (
              <li className="hand reading-note-head" lang="en">
                {it.heading}
              </li>
            )}
            <Item n={no(i)} checked={checked} ok={res(k)?.ok} why={it.why_pl}>
              <p lang="en" className="ex-sent">
                {before}
                <GapInput k={k} n={no(i)} value={get(k)} set={set} res={res(k)} />
                {after}
              </p>
              <GapAfter task={task} i={i} value={get(k)} checked={checked} res={res(k)} />
            </Item>
          </Fragment>
        )
      })}
    </ol>
  )
}

// streszczenie: jeden akapit z lukami, licznik i objaśnienia pod spodem
function GapSummary({ task, ti, no, get, set, checked, res }: GapProps) {
  return (
    <>
      <p lang="en" className="ex-sent reading-summary">
        {task.items.map((it, i) => {
          const k = itemKey(ti, i)
          const [before, after] = splitBlanks(it.sentence)
          return (
            <Fragment key={i}>
              {i > 0 && ' '}
              {before}
              <sup className="hand">{no(i)}</sup>
              <GapInput k={k} n={no(i)} value={get(k)} set={set} res={res(k)} />
              {after}
            </Fragment>
          )
        })}
      </p>
      <ol className="stack reading-items">
        {task.items.map((it, i) => {
          const k = itemKey(ti, i)
          const v = get(k)
          if (!checked && !(task.maxWords && v.trim())) return null
          return (
            <Item key={i} n={no(i)} checked={checked} ok={res(k)?.ok} why={it.why_pl}>
              <GapAfter task={task} i={i} value={v} checked={checked} res={res(k)} />
            </Item>
          )
        })}
      </ol>
    </>
  )
}

function GapInput({
  k,
  n,
  value,
  set,
  res,
}: {
  k: string
  n: string
  value: string
  set: (k: string, v: string) => void
  res: ReadingResult | undefined
}) {
  return (
    <input
      className={`gap-in${res ? (res.ok ? ' ok' : ' bad') : ''}`}
      style={{ width: `${Math.max(7, value.length * 0.5 + 1.4)}em` }}
      value={value}
      aria-label={pl.reading.gapN(n)}
      readOnly={!!res}
      onChange={(e) => set(k, e.target.value)}
      {...answerInput}
    />
  )
}

// przed sprawdzeniem licznik wyrazów, po: dlaczego 0 i wszystkie odpowiedzi z klucza
function GapAfter({
  task,
  i,
  value,
  checked,
  res,
}: {
  task: Gap
  i: number
  value: string
  checked: boolean
  res: ReadingResult | undefined
}) {
  const t = pl.exercises
  if (!checked) {
    if (!task.maxWords || !value.trim()) return null
    const n = countWords(value)
    return (
      <p className={`note ink ex-count${n > task.maxWords ? ' over' : ''}`}>
        {t.wordCount(n, task.maxWords)}
      </p>
    )
  }
  if (!res || res.ok) return null
  return (
    <p className="note ink reading-key">
      {res.reason && <span className="red">{t.miss[res.reason]} </span>}
      {t.keyIs} <span lang="en">{task.items[i]!.correct.join(' / ')}</span>
    </p>
  )
}

function Item({
  n,
  checked,
  ok,
  why,
  extra,
  children,
}: {
  n: string
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
