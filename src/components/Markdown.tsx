import { parseMarkdown, type Inline } from '../lib/markdown'

function Inlines({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) => {
        if (p.kind === 'bold') return <strong key={i}>{p.text}</strong>
        if (p.kind === 'italic') return <em key={i}>{p.text}</em>
        if (p.kind === 'mark')
          return (
            <span key={i} className="hl hl-y">
              {p.text}
            </span>
          )
        return p.text
      })}
    </>
  )
}

export function Markdown({ src, className }: { src: string; className?: string }) {
  return (
    <div className={['md', className].filter(Boolean).join(' ')}>
      {parseMarkdown(src).map((b, i) =>
        b.kind === 'p' ? (
          <p key={i}>
            <Inlines parts={b.inline} />
          </p>
        ) : (
          <ul key={i}>
            {b.items.map((item, j) => (
              <li key={j}>
                <Inlines parts={item} />
              </li>
            ))}
          </ul>
        ),
      )}
    </div>
  )
}
