import { Card, Sticky } from '../../components/Paper'
import { FormulaParts } from '../../components/Formula'
import { Markdown } from '../../components/Markdown'
import type { Block } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { ExampleLine } from '../tenses/ExampleLine'

// jeden blok tematu = jeden kawałek kartki; nowy typ bloku dopisuje się w schemacie i tutaj
export function BlockView({ block }: { block: Block }) {
  const t = pl.topics
  switch (block.type) {
    case 'text':
      return <Markdown src={block.md_pl} className="block" />
    case 'table':
      return (
        <div className="block table-wrap">
          <table className="nb-table">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i}>
                  {r.map((c, j) => (
                    <td key={j}>{c}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    case 'examples':
      return (
        <ul className="block stack" style={{ gap: 8 }}>
          {block.items.map((ex, i) => (
            <li key={i}>
              <ExampleLine ex={ex} />
            </li>
          ))}
        </ul>
      )
    case 'callout':
      if (block.variant === 'matura')
        return (
          <section className="block sk red alt callout-matura">
            <p className="eyebrow">{t.callout.matura}</p>
            <Markdown src={block.md_pl} />
          </section>
        )
      return (
        <Sticky
          color={block.variant === 'tip' ? 'y' : 'p'}
          tilt={block.variant === 'tip' ? -1 : 1}
          tape={{ color: block.variant === 'tip' ? 'm' : 'y' }}
          className="block callout"
        >
          <p className="eyebrow">{t.callout[block.variant]}</p>
          <Markdown src={block.md_pl} />
        </Sticky>
      )
    case 'formula':
      return (
        <Card variant="index-card" tilt={-1} className="block">
          <p className="fparts" lang="en" style={{ lineHeight: '28px' }}>
            <FormulaParts parts={block.parts} />
          </p>
          {block.example && <ExampleLine ex={block.example} />}
        </Card>
      )
    case 'steps':
      return (
        <ol className="block steps">
          {block.items.map((s, i) => (
            <li key={i} className="step">
              <span className="step-n">{i + 1}</span>
              <span>
                <span className="step-k">{s.step_pl}</span>
                <span className="step-t">{s.text_pl}</span>
              </span>
            </li>
          ))}
        </ol>
      )
  }
}
