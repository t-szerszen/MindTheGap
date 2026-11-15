import { useState } from 'react'
import { Button } from '../../components/Controls'
import { Doodle } from '../../components/Ink'
import { pl } from '../../i18n/pl'

type Step = { step_pl: string; text_pl: string }

// kroki pojawiają się po kolei, jakby ktoś je dopisywał na kartce
export function HowToChoose({ steps }: { steps: Step[] }) {
  const [shown, setShown] = useState(1)
  const t = pl.tenses
  const done = shown >= steps.length
  return (
    <section className="sk alt tsec choose" aria-labelledby="choose-h">
      <h2 id="choose-h" className="h-m">
        {t.choose}
      </h2>
      <p className="note ink" style={{ fontSize: 14 }}>
        {t.chooseHint}
      </p>
      <ol className="steps" style={{ marginTop: 6 }} aria-live="polite">
        {steps.map((s, i) => {
          const on = i < shown
          return (
            <li key={i}>
              {i > 0 && <Doodle kind="down" className="step-arrow" />}
              <div className={`step ${on ? 'on' : 'ghost'}`}>
                <span className="step-n">{i + 1}</span>
                <span>
                  <span className="step-k">{s.step_pl}</span>
                  <span className="step-t">{on ? s.text_pl : '…'}</span>
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      <div className="row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
        <Button variant="primary" size="sm" onClick={() => setShown(done ? 1 : shown + 1)}>
          {done ? t.again : t.nextStep}
        </Button>
        {!done && (
          <button type="button" className="link-pen" onClick={() => setShown(steps.length)}>
            {t.showAll}
          </button>
        )}
      </div>
    </section>
  )
}
