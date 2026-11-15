import type { Ex } from '../../content/schema'
import { markSignals } from '../../lib/text/signals'

export function ExampleLine({ ex, signals = [] }: { ex: Ex; signals?: string[] }) {
  return (
    <>
      <p className="ex-line" lang="en">
        {markSignals(ex.en, signals).map((s, i) =>
          s.signal ? (
            <span key={i} className="hl hl-y">
              {s.text}
            </span>
          ) : (
            s.text
          ),
        )}
      </p>
      <span className="ex-pl">{ex.pl}</span>
    </>
  )
}
