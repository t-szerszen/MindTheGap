import { useId, useState } from 'react'
import { Button } from '../../components/Controls'
import { Mark } from '../../components/Ink'
import type { ExStep } from '../../content/schema'
import { pl } from '../../i18n/pl'
import type { PartResult } from '../../lib/exercises/check'

export type ItemProps = {
  n: number
  get: (key: string) => string
  set: (key: string, v: string) => void
  // null, dopóki zadanie nie jest sprawdzone
  results: PartResult[] | null
  // bez onCheck (arkusz próbny) nie ma przycisku przy zadaniu, sprawdza się wszystko na końcu
  onCheck?: () => void
}

export function Task({ text }: { text: string }) {
  return <p className="eyebrow ex-task">{text}</p>
}

// po sprawdzeniu: przy błędzie kroki od razu, przy dobrej odpowiedzi zwinięte pod przyciskiem
export function StepsNote({ ok, head, steps }: { ok: boolean; head: string; steps: ExStep[] }) {
  const t = pl.exercises
  const id = useId()
  const [open, setOpen] = useState(!ok)
  return (
    <div className={`mnote ex-note${ok ? ' ok' : ''}`} aria-live="polite">
      {/* nagłówek i przycisk w jednym wierszu, wcześniej na szerokim ekranie wchodziły na siebie */}
      <div className="mnote-row">
        <span className="mhead">{head}</span>
        <button
          type="button"
          className={`link-pen mnote-toggle ${ok ? 'green' : 'red'}`}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen(!open)}
        >
          {open ? t.hideSteps : t.showSteps}
        </button>
      </div>
      <div id={id} hidden={!open}>
        {open &&
          steps.map((s, j) => (
            <span key={j} className={`mstep d${j + 1}`}>
              <b>{j + 1}</b>
              <span>
                <span className="mlabel">{s.label_pl}: </span>
                {s.text_pl}
              </span>
            </span>
          ))}
      </div>
    </div>
  )
}

export function CheckRow({
  results,
  canCheck,
  onCheck,
}: {
  results: PartResult[] | null
  canCheck: boolean
  onCheck?: () => void
}) {
  const t = pl.exercises
  if (results) {
    const good = results.filter((r) => r.ok).length
    const all = good === results.length
    return (
      <div className="row ex-result">
        <Mark ok={all} label={all ? t.good : t.bad} />
        {results.length > 1 && (
          <span className="hand ex-points">{t.points(good, results.length)}</span>
        )}
      </div>
    )
  }
  if (!onCheck) return null
  return (
    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 2 }}>
      <Button size="sm" variant="primary" onClick={onCheck} disabled={!canCheck}>
        {t.check}
      </Button>
    </div>
  )
}
