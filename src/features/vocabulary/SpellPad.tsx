import { useState, type FormEvent } from 'react'
import { Button, LineField } from '../../components/Controls'
import { Mark } from '../../components/Ink'
import { pl } from '../../i18n/pl'
import { checkSpelling, type Spelling } from '../../lib/vocab/spelling'

// ile przepisanych linijek zostaje na kartce, starsze znikają
const KEEP_LINES = 4

// pole pod fiszką: najpierw piszę odpowiedź z głowy, po odwróceniu mogę ją przepisać parę razy
export function SpellPad({
  answer,
  lang,
  flipped,
  onReveal,
}: {
  answer: string
  lang: 'pl' | 'en'
  flipped: boolean
  onReveal: () => void
}) {
  const t = pl.review.spell
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<Spelling | null>(null)
  const [line, setLine] = useState('')
  const [lines, setLines] = useState<{ text: string; ok: boolean }[]>([])

  function check(e: FormEvent) {
    e.preventDefault()
    if (!typed.trim()) return
    setResult(checkSpelling(typed, answer))
    onReveal()
  }

  function addLine(e: FormEvent) {
    e.preventDefault()
    if (!line.trim()) return
    setLines((cur) =>
      [...cur, { text: line.trim(), ok: checkSpelling(line, answer) === 'ok' }].slice(-KEEP_LINES),
    )
    setLine('')
  }

  if (!flipped)
    return (
      <form className="row spell-row" onSubmit={check}>
        <LineField
          className="grow"
          label={t.label[lang]}
          value={typed}
          placeholder={t.placeholder}
          onChange={(e) => setTyped(e.target.value)}
          lang={lang}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
        />
        <Button type="submit" size="sm" disabled={!typed.trim()}>
          {t.check}
        </Button>
      </form>
    )

  return (
    <div className="spell-pad">
      {result && (
        <p className={`note spell-res ${result}`} role="status">
          <Mark ok={result === 'ok'} label={t.result[result]} />
          <span>
            {t.result[result]}
            {result !== 'ok' && (
              <>
                {' '}
                <s lang={lang}>{typed.trim()}</s>
              </>
            )}
          </span>
        </p>
      )}
      <form onSubmit={addLine}>
        <LineField
          label={t.practice}
          value={line}
          placeholder={t.practiceHint}
          onChange={(e) => setLine(e.target.value)}
          lang={lang}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="enter"
        />
      </form>
      {lines.length > 0 && (
        <ol className="spell-lines" lang={lang}>
          {lines.map((l, i) => (
            <li key={i} className={l.ok ? 'ok' : 'bad'}>
              <span className="pen">{l.text}</span>
              <Mark ok={l.ok} label={l.ok ? t.result.ok : t.result.wrong} />
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
