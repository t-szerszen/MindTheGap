import type { ReactNode } from 'react'
import { MarkedText, RoleLegend } from '../../components/Formula'
import { Doodle } from '../../components/Ink'
import type { GrammarSubtype, GrammarTab, GrammarTopic } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { parseMarked } from '../../lib/text/marked'
import { groupTab } from './groups'
import { Scale } from './Scale'

// telefon: jedna kolumna (ściąga na końcu), komputer: dwie kolumny jak w Desktop_gramatyka
export function SubtypeView({
  view,
  sub,
  group,
  onPick,
  children,
}: {
  view: GrammarTopic
  sub: GrammarSubtype
  group: GrammarTab['group']
  onPick: (id: string) => void
  children: ReactNode
}) {
  const g = pl.grammar
  const roles = new Set(sub.formula.flatMap((r) => parseMarked(r.text).map((p) => p.role)))
  return (
    <div className="gr-body">
      <div className="gr-col">
        <div className={`subtabs ${groupTab[group]}`} role="group" aria-label={g.subtypes}>
          {view.subtypes.map((s) => (
            <button
              key={s.id}
              type="button"
              className="subtab"
              aria-pressed={s.id === sub.id}
              onClick={() => onPick(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <section aria-labelledby="sub-h">
          <div className="hdr" style={{ flexWrap: 'wrap', alignItems: 'baseline' }}>
            <h2 id="sub-h" className="h-m" lang="en">
              {sub.name}
            </h2>
            <span className="tag tg-b">{g.time(sub.time_pl)}</span>
          </div>
          <p className="note blue">{sub.desc_pl}</p>
          <Scale key={sub.id} scale={sub.scale} className="gr-scale" />
        </section>

        <section aria-labelledby="build-h">
          <h2 id="build-h" className="h-s">
            {g.build}
          </h2>
          <div style={{ margin: '4px 0 8px' }}>
            <RoleLegend roles={roles} />
          </div>
          <div className="formula" lang="en">
            {sub.formula.map((r, i) => (
              <div key={i} className="frow">
                {r.key.length === 1 ? (
                  <span className="fsign" aria-hidden="true">
                    {r.key}
                  </span>
                ) : (
                  <span className="fkey" lang="pl">
                    {r.key}
                  </span>
                )}
                <p className="fparts">
                  {r.key.length === 1 && g.signs[r.key] && (
                    <span className="sr" lang="pl">
                      {g.signs[r.key]}:{' '}
                    </span>
                  )}
                  <MarkedText text={r.text} />
                </p>
              </div>
            ))}
          </div>
        </section>

        {view.cheat && (
          <section className="gr-cheat" aria-labelledby="cheat-h">
            <h2 id="cheat-h" className="h-s">
              {view.cheat.title_pl}
            </h2>
            <div className="cheat" role="table" aria-labelledby="cheat-h" lang="en">
              <div className="cheat-row" role="row">
                {view.cheat.headers.map((h) => (
                  <span key={h} className="hd" role="columnheader" lang="pl">
                    {h}
                  </span>
                ))}
              </div>
              {view.cheat.rows.map(([ty, a, b]) => {
                const on = ty === sub.id ? ' on' : ''
                return (
                  <div key={ty} className="cheat-row" role="row">
                    <span className={`ty${on}`} role="cell">
                      {ty}
                    </span>
                    <span className={on} role="cell">
                      <MarkedText text={a} />
                    </span>
                    <span className={on} role="cell">
                      <MarkedText text={b} />
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      <div className="gr-col">
        <section aria-labelledby="use-h">
          <h2 id="use-h" className="h-s">
            {g.uses}
          </h2>
          <ul className="stack" style={{ gap: 6, marginTop: 6 }}>
            {sub.usage_pl.map((u, i) => (
              <li key={i} className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                <Doodle kind="arrow" className="use-arrow" />
                <p className="small">
                  <MarkedText text={u} />
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="gsig-h" style={{ position: 'relative' }}>
          <Doodle kind="star" tone="k" className="sig-star" />
          <h2 id="gsig-h" className="h-s">
            {g.signals}
          </h2>
          <p className="sigs" lang="en" style={{ marginTop: 6 }}>
            {sub.signals.map((s) => (
              <span key={s} className="hl hl-y">
                {s}
              </span>
            ))}
          </p>
        </section>

        <section aria-labelledby="gex-h">
          <h2 id="gex-h" className="h-s">
            {g.examples}
          </h2>
          <ol className="stack" style={{ gap: 8, marginTop: 4 }}>
            {sub.examples.map((e, i) => (
              <li key={i}>
                <p className="ex-line" lang="en">
                  <MarkedText text={e.en} />
                </p>
                <span className="ex-pl">{e.pl}</span>
              </li>
            ))}
          </ol>
        </section>

        {children}
      </div>
    </div>
  )
}
