import { useState } from 'react'
import { TagButton } from '../../components/Controls'
import { FormulaParts, RoleLegend } from '../../components/Formula'
import { Sticky } from '../../components/Paper'
import type { FormSet, Role, Tense } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { ExampleLine } from './ExampleLine'

const rows: { key: keyof FormSet; sign: string }[] = [
  { key: 'affirmative', sign: '+' },
  { key: 'negative', sign: '−' },
  { key: 'question', sign: '?' },
  { key: 'whQuestion', sign: 'wh' },
]

function rolesOf(set: FormSet) {
  return new Set<Role>(rows.flatMap((r) => set[r.key].pattern.map((p) => p.role)))
}

export function FormsSection({ forms, signals }: { forms: Tense['forms']; signals: string[] }) {
  const [voice, setVoice] = useState<'active' | 'passive'>('active')
  const t = pl.tenses
  const set = voice === 'active' ? forms.active : forms.passive

  return (
    <section className="tsec" aria-labelledby="build-h">
      <h2 id="build-h" className="h-s">
        {t.build}
      </h2>
      <div className="row" role="group" aria-label={t.voice} style={{ gap: 6, marginTop: 6 }}>
        <TagButton pressed={voice === 'active'} onClick={() => setVoice('active')}>
          {t.active}
        </TagButton>
        <TagButton pressed={voice === 'passive'} onClick={() => setVoice('passive')}>
          {t.passive}
        </TagButton>
      </div>

      {set ? (
        <>
          <div style={{ margin: '6px 0 10px' }}>
            <RoleLegend roles={rolesOf(set)} />
          </div>
          <div className="formula" lang="en">
            {rows.map((r) => {
              const f = set[r.key]
              return (
                <div key={r.key} className="frow">
                  <span className={`fsign${r.sign === 'wh' ? ' wh' : ''}`} aria-hidden="true">
                    {r.sign}
                  </span>
                  <div className="grow">
                    <p className="fparts">
                      <span className="sr" lang="pl">
                        {t.forms[r.key]}:{' '}
                      </span>
                      <FormulaParts parts={f.pattern} />
                    </p>
                    <ExampleLine ex={f.example} signals={signals} />
                    {f.note_pl && (
                      <p className="note ink" lang="pl" style={{ marginTop: 2 }}>
                        {f.note_pl}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <Sticky color="o" tilt={1} style={{ marginTop: 12 }}>
          <p className="h-s">{t.noPassive}</p>
          <p className="small" style={{ marginTop: 4 }}>
            {forms.passiveNote_pl}
          </p>
        </Sticky>
      )}
      {set && voice === 'passive' && forms.passiveNote_pl && (
        <p className="note" style={{ marginTop: 8 }}>
          {forms.passiveNote_pl}
        </p>
      )}
    </section>
  )
}
