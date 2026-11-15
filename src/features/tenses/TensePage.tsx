import { Suspense } from 'react'
import { Link, useParams } from 'react-router'
import { FormulaParts } from '../../components/Formula'
import { HowToChoose } from '../../components/HowToChoose'
import { Doodle, Scribble } from '../../components/Ink'
import { Icon } from '../../components/Icon'
import { Card, Sticky, type Tilt } from '../../components/Paper'
import { NotFound } from '../../components/States'
import { Timeline } from '../../components/Timeline'
import { pl } from '../../i18n/pl'
import { getTense, getTenses, useExercises } from '../../lib/content'
import { signalPhrases } from '../../lib/text/signals'
import { ExampleLine } from './ExampleLine'
import { FormsSection } from './FormsSection'
import { TenseTabs } from './TenseTabs'

const tilts: Tilt[] = [-1, 1, 0, -2, 2]

export function TensePage() {
  const { id = '' } = useParams()
  const tense = getTense(id)
  if (!tense) return <NotFound />

  const all = getTenses()
  const t = pl.tenses
  const index = all.indexOf(tense)
  const signals = signalPhrases(tense.signalWords.map((s) => s.word))

  return (
    <div className="tense-wrap">
      <article className="sheet ruled page-in tense-sheet">
        <header className="stack" style={{ gap: 2 }}>
          <p className="eyebrow">{t.eyebrow(index + 1, all.length, t.groups[tense.group])}</p>
          <h1 className="h-xl tense-title" lang="en">
            {tense.nameEn}
          </h1>
          <Scribble width={210} />
          <p className="note" style={{ marginTop: 2 }}>
            {tense.oneLiner_pl}
          </p>
        </header>

        <section className="tense-timeline" aria-label={t.timeline.label}>
          <Timeline now={tense.timeline.now} marks={tense.timeline.marks} />
        </section>

        <div className="tense-body">
          <FormsSection forms={tense.forms} signals={signals} />

          <section className="tsec" aria-labelledby="uses-h">
            <h2 id="uses-h" className="h-s">
              {t.uses}
            </h2>
            <ol className="stack" style={{ gap: 14, marginTop: 6 }}>
              {tense.uses.map((u, i) => (
                <li key={i} className="use">
                  <p className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                    <Doodle kind="arrow" className="use-arrow" />
                    <span className="use-title">{u.title_pl}</span>
                  </p>
                  <p className="small muted">{u.explanation_pl}</p>
                  <ul className="stack" style={{ gap: 4, marginTop: 4 }}>
                    {u.examples.map((ex, j) => (
                      <li key={j}>
                        <ExampleLine ex={ex} signals={signals} />
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          <section className="tsec" aria-labelledby="sig-h" style={{ position: 'relative' }}>
            <Doodle kind="star" tone="k" className="sig-star" />
            <h2 id="sig-h" className="h-s">
              {t.signals}
            </h2>
            <dl className="sig-list" lang="en">
              {tense.signalWords.map((s) => (
                <div key={s.word} className="sig-row">
                  <dt>
                    <span className="hl hl-y">{s.word}</span>
                  </dt>
                  {s.note_pl && (
                    <dd className="note ink" lang="pl">
                      {s.note_pl}
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </section>

          <HowToChoose
            key={tense.id}
            title={t.choose}
            hint={t.chooseHint}
            steps={tense.howToChoose.map((s) => ({ key: s.step_pl, text: s.text_pl }))}
          />

          {tense.modals && (
            <section className="tsec" aria-labelledby="modal-h">
              <h2 id="modal-h" className="h-s">
                {t.modals}
              </h2>
              <ul className="stack" style={{ gap: 12, marginTop: 6 }}>
                {tense.modals.map((m) => (
                  <li key={m.modal}>
                    <p className="hand" style={{ fontSize: 21, fontWeight: 700 }} lang="en">
                      {m.modal}
                    </p>
                    <p className="fparts" lang="en">
                      <FormulaParts parts={m.pattern} />
                    </p>
                    <ExampleLine ex={m.example} />
                    {m.note_pl && <p className="note ink">{m.note_pl}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tense.relatedTenses.length > 0 && (
            <section className="tsec" aria-labelledby="rel-h">
              <h2 id="rel-h" className="h-s">
                {t.related}
              </h2>
              <div className="stack" style={{ gap: 18, marginTop: 10 }}>
                {tense.relatedTenses.map((r, i) => {
                  const other = getTense(r.id)
                  return (
                    <Card key={r.id} variant="index-card" tilt={tilts[i % tilts.length]}>
                      <Link className="link-pen related-link" to={`/tenses/${r.id}`} lang="en">
                        {other?.nameEn ?? r.id}
                        <Icon name="next" size="s" />
                      </Link>
                      <p className="small" style={{ lineHeight: '28px' }}>
                        {r.relation_pl}
                      </p>
                      {r.contrast && (
                        <ul className="stack" style={{ marginTop: 4 }}>
                          {r.contrast.map((ex, j) => (
                            <li key={j}>
                              <ExampleLine ex={ex} />
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  )
                })}
              </div>
            </section>
          )}

          {tense.commonMistakes.length > 0 && (
            <section className="tsec" aria-labelledby="mis-h">
              <h2 id="mis-h" className="h-s">
                {t.mistakes}
              </h2>
              <ul className="stack" style={{ gap: 12, marginTop: 6 }}>
                {tense.commonMistakes.map((m, i) => (
                  <li key={i} className="mistake">
                    <p lang="en">
                      <span className="sr" lang="pl">
                        {t.wrong}:{' '}
                      </span>
                      <span className="u-wavy strike-soft">{m.wrong}</span>
                    </p>
                    <p lang="en" className="pen mistake-right">
                      <span className="sr" lang="pl">
                        {t.right}:{' '}
                      </span>
                      {m.right}
                    </p>
                    <p className="note ink">{m.why_pl}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tense.maturaTips_pl.length > 0 && (
            <section className="tsec" aria-labelledby="tips-h">
              <Sticky color="y" tilt={-1} tape={{ color: 'p' }} className="tips">
                <h2 id="tips-h" className="h-m">
                  {t.tips}
                </h2>
                <ul className="stack" style={{ gap: 8, marginTop: 8 }}>
                  {tense.maturaTips_pl.map((tip, i) => (
                    <li key={i} className="row" style={{ alignItems: 'flex-start', gap: 8 }}>
                      <span className="step-n tip-n">{i + 1}</span>
                      <span className="small">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Sticky>
            </section>
          )}
        </div>

        <div className="tsec stack" style={{ gap: 4 }}>
          <Link className="btn btn-primary btn-block" to={`/exercises/session?tags=${tense.id}`}>
            <Icon name="pencil" />
            {t.practice}
          </Link>
          <p className="note ink" style={{ textAlign: 'center' }}>
            <Suspense fallback={null}>
              <PracticeCount tag={tense.id} />
            </Suspense>
          </p>
        </div>
      </article>
      <TenseTabs tenses={all} current={tense.id} />
    </div>
  )
}

// liczba zdań do ćwiczeń dociąga się osobno, żeby notatka nie czekała na cały bank
function PracticeCount({ tag }: { tag: string }) {
  const n = useExercises().filter((e) => e.tags.includes(tag)).length
  return <>{pl.tenses.practiceCount(n)}</>
}
