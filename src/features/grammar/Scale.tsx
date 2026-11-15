import type { GrammarScale } from '../../content/schema'
import { pl } from '../../i18n/pl'

const X = [40, 116, 192, 268]
// etykiety na przemian nad i pod osią, inaczej się nie mieszczą na telefonie
const LABEL = [
  { y: 44, anchor: 'mid' },
  { y: 92, anchor: 'mid' },
  { y: 44, anchor: 'mid' },
  { y: 92, anchor: 'end', x: 306 },
]

// odręczne kółko wokół wybranego punktu; rysuje się animacją ring-draw (przy reduced-motion od razu)
const ring = (x: number) =>
  `M${x + 14} 58C${x + 13} 48 ${x - 10} 46 ${x - 14} 58C${x - 17} 70 ${x + 6} 76 ${x + 14} 66C${x + 17} 61 ${x + 12} 52 ${x + 4} 50`

export function Scale({ scale, className }: { scale: GrammarScale; className?: string }) {
  const on = (i: number) => (scale.on.includes(i) ? ' on' : '')
  return (
    <svg
      className={`scale${className ? ` ${className}` : ''}`}
      viewBox="0 0 316 104"
      role="img"
      aria-label={pl.grammar.scaleLabel(scale.left, scale.right, scale.ticks)}
    >
      <text className="endl" x="4" y="14">
        ← {scale.left}
      </text>
      <text className="endl end" x="312" y="14">
        {scale.right} →
      </text>
      <path className="ax" d="M16 62C90 60 220 64 300 62" />
      <path className="tk" d={X.map((x) => `M${x} 55L${x} 69`).join('')} />
      {X.map((x, i) => (
        <circle key={i} className={`dot${on(i)}`} cx={x} cy="62" r="6" />
      ))}
      {scale.ticks.map((t, i) => {
        const l = LABEL[i]!
        return (
          <text key={i} className={`lb${on(i)} ${l.anchor}`} x={l.x ?? X[i]} y={l.y}>
            {t}
          </text>
        )
      })}
      {scale.ring !== null && <path className="ring" d={ring(X[scale.ring]!)} />}
    </svg>
  )
}
