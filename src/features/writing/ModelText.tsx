import type { ReactNode } from 'react'
import type { WritingModel } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { countWords } from '../../lib/answers/words'

// wzór z zakreślonymi fragmentami: numer przy cytacie, komentarz pod tekstem (jak notatki na marginesie)
export function ModelText({ model }: { model: WritingModel }) {
  const t = pl.writing
  let n = 0
  const numbered = model.annotations.map((a) => ({ ...a, n: ++n }))

  function mark(text: string): ReactNode[] {
    const hits = numbered
      .map((a) => ({ a, at: text.indexOf(a.quote) }))
      .filter((h) => h.at >= 0)
      .sort((x, y) => x.at - y.at)
    const out: ReactNode[] = []
    let pos = 0
    for (const { a, at } of hits) {
      if (at < pos) continue
      out.push(text.slice(pos, at))
      out.push(
        <mark key={a.n} className={`anno c-${a.criterion}`}>
          {a.quote}
          <sup>{a.n}</sup>
        </mark>,
      )
      pos = at + a.quote.length
    }
    out.push(text.slice(pos))
    return out
  }

  return (
    <article className="model">
      <p className="eyebrow">
        {t.modelKind[model.kind]} · {t.words(countWords(model.paragraphs.join(' ')))}
      </p>
      <div lang="en" className="model-text">
        {model.title && <h3 className="h-m">{mark(model.title)}</h3>}
        {model.paragraphs.map((p, i) => (
          <p key={i}>{mark(p)}</p>
        ))}
      </div>
      {numbered.length > 0 && (
        <ol className="model-notes">
          {numbered.map((a) => (
            <li key={a.n} className={`c-${a.criterion}`}>
              <b>{a.n}</b>
              <span>
                <span className="mlabel">{t.criteria[a.criterion]}: </span>
                {a.note_pl}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="note model-comment">{model.comment_pl}</p>
    </article>
  )
}
