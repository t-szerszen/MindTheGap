import { useId } from 'react'
import { Link, useParams } from 'react-router'
import { Button } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Sticky } from '../../components/Paper'
import { NotFound } from '../../components/States'
import type { Checklist, WritingForm } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { countWords } from '../../lib/answers/words'
import { useChecklist, useWritingTasks } from '../../lib/content'
import { lengthPos, lengthStatus } from '../../lib/writing/length'
import { useAuth } from '../auth/useAuth'
import { ModelText } from './ModelText'
import { Stopwatch } from './Stopwatch'
import { useDraft } from './useDraft'

export function WritingPage() {
  const { id = '' } = useParams()
  const task = useWritingTasks().find((w) => w.id === id)
  const checklist = useChecklist()
  const { user } = useAuth()
  const [draft, update] = useDraft(id)
  const textId = useId()
  const planId = useId()
  if (!task) return <NotFound />
  const t = pl.writing
  const words = countWords(draft.text)
  const status = lengthStatus(words)

  return (
    <div className="sheet ruled page-in writing">
      <div className="measure stack">
        <header className="stack" style={{ gap: 2 }}>
          <Link className="link-pen back-link" to="/writing">
            <Icon name="back" size="s" />
            {t.back}
          </Link>
          <p className="eyebrow">
            {t.forms[task.form]} · {pl.themes[task.theme]}
          </p>
        </header>

        <Sticky color="y" tilt={-1} tape={{ color: 'b' }} className="writing-task">
          <p className="body-l">{task.prompt_pl}</p>
          <p className="note" style={{ marginTop: 8 }}>
            {t.elements}
          </p>
          <ol className="writing-elements">
            {task.elements_pl.map((e, i) => (
              <li key={i}>
                <span className="hand">{i + 1}.</span> {e}
              </li>
            ))}
          </ol>
        </Sticky>

        <Stopwatch seconds={draft.seconds} onChange={(s) => update({ seconds: s })} />

        <details className="writing-plan">
          <summary className="h-s">{t.planTitle}</summary>
          <p className="note ink">{task.planHint_pl}</p>
          <label className="sr" htmlFor={planId}>
            {t.planLabel}
          </label>
          <textarea
            id={planId}
            className="line-area"
            rows={4}
            value={draft.plan}
            readOnly={draft.submitted}
            placeholder={t.planPlaceholder}
            onChange={(e) => update({ plan: e.target.value })}
          />
        </details>

        <div className="stack" style={{ gap: 6 }}>
          <label className="field-label" htmlFor={textId}>
            {t.textLabel}
          </label>
          <textarea
            id={textId}
            className="line-area writing-text"
            lang="en"
            rows={16}
            value={draft.text}
            readOnly={draft.submitted}
            placeholder={t.textPlaceholder}
            onChange={(e) => update({ text: e.target.value })}
            spellCheck={false}
          />
          <div className={`len-bar s-${status}`} aria-hidden="true">
            <span className="len-ok" />
            <span className="len-pin" style={{ left: `${lengthPos(words) * 100}%` }} />
          </div>
          <p className={`note len-note s-${status}`} aria-live="polite">
            <b className="hand">{t.words(words)}</b> · {t.length[status]}
          </p>
          {!user && <p className="note ink small">{t.notSaved}</p>}
        </div>

        {draft.submitted ? (
          <Button onClick={() => update({ submitted: false })}>{t.reopen}</Button>
        ) : (
          <Button
            variant="primary"
            block
            disabled={!words}
            onClick={() => update({ submitted: true })}
          >
            <Icon name="check" />
            {t.submit}
          </Button>
        )}

        {draft.submitted && (
          <>
            <SelfCheck
              checklist={checklist}
              form={task.form}
              checks={draft.checks}
              onToggle={(key) =>
                update({
                  checks: draft.checks.includes(key)
                    ? draft.checks.filter((c) => c !== key)
                    : [...draft.checks, key],
                })
              }
            />
            <section className="tsec stack" aria-labelledby="models-h">
              <h2 id="models-h" className="h-m">
                {t.modelsTitle}
              </h2>
              {task.models.length ? (
                task.models.map((m, i) => <ModelText key={i} model={m} />)
              ) : (
                <p className="note ink">{t.noModels}</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

function SelfCheck({
  checklist,
  form,
  checks,
  onToggle,
}: {
  checklist: Checklist
  form: WritingForm
  checks: string[]
  onToggle: (key: string) => void
}) {
  const t = pl.writing
  return (
    <section className="tsec stack" aria-labelledby="self-h">
      <h2 id="self-h" className="h-m">
        {t.selfTitle}
      </h2>
      <p className="note ink">{t.selfHint}</p>
      {checklist.map((g) => {
        const items = g.items
          .map((it, i) => ({ ...it, key: `${g.criterion}-${i}` }))
          .filter((it) => !it.forms || it.forms.includes(form))
        const done = items.filter((it) => checks.includes(it.key)).length
        return (
          <fieldset key={g.criterion} className="self-group">
            <legend className="h-s">
              {t.criteria[g.criterion]}{' '}
              <span className="note ink">
                {t.maxPoints(g.max)} · {t.checked(done, items.length)}
              </span>
            </legend>
            {items.map((it) => (
              <label key={it.key} className="self-item">
                <input
                  type="checkbox"
                  checked={checks.includes(it.key)}
                  onChange={() => onToggle(it.key)}
                />
                <span>{it.text_pl}</span>
              </label>
            ))}
          </fieldset>
        )
      })}
    </section>
  )
}
