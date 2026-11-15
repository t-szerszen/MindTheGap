import { useState, type ReactNode } from 'react'
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
  onCheck: () => void
}

export function Task({ text }: { text: string }) {
  return <p className="eyebrow ex-task">{text}</p>
}

export function StepsNote({ head, steps }: { head: string; steps: ExStep[] }) {
  return (
    <div className="mnote ex-note" aria-live="polite">
      <span className="mhead">{head}</span>
      {steps.map((s, j) => (
        <span key={j} className={`mstep d${j + 1}`}>
          <b>{j + 1}</b>
          <span>
            <span className="mlabel">{s.label_pl}: </span>
            {s.text_pl}
          </span>
        </span>
      ))}
    </div>
  )
}

// po sprawdzeniu: wyjaśnienie od razu przy błędzie, przy dobrej odpowiedzi na żądanie
export function Explain({ ok, children }: { ok: boolean; children: ReactNode }) {
  const t = pl.exercises
  const [open, setOpen] = useState(false)
  if (!ok) return <>{children}</>
  return (
    <>
      {open && children}
      <button type="button" className="link-pen ex-steps-toggle" onClick={() => setOpen(!open)}>
        {open ? t.hideSteps : t.showSteps}
      </button>
    </>
  )
}

export function CheckRow({
  results,
  canCheck,
  onCheck,
}: {
  results: PartResult[] | null
  canCheck: boolean
  onCheck: () => void
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
  return (
    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 2 }}>
      <Button size="sm" variant="primary" onClick={onCheck} disabled={!canCheck}>
        {t.check}
      </Button>
    </div>
  )
}
