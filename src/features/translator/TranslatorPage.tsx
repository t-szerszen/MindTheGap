import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Doodle } from '../../components/Ink'
import { Card, Sticky, TornSheet, type NoteColor, type Tilt } from '../../components/Paper'
import { pl } from '../../i18n/pl'
import type { WordInput } from '../../lib/db/words'
import {
  MAX_CHARS,
  translate,
  TranslateError,
  type Direction,
  type TranslateErrorKind,
} from '../../lib/translate'
import { englishSide, findDuplicate, polishSide } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { SaveWordSheet } from '../vocabulary/SaveWordSheet'
import { useWords } from '../vocabulary/useWords'

const workerUrl = import.meta.env.VITE_TRANSLATE_API_URL
const DEBOUNCE_MS = 700
const noteColors: NoteColor[] = ['p', 'm', 'y', 'b', 'o']
const tilts: Tilt[] = [-2, 1, 2, -1, 1, -2]

type Result = { source: string; text: string; direction: Direction }

export function TranslatorPage() {
  const t = pl.translator
  const { user } = useAuth()
  const { words } = useWords()
  const [direction, setDirection] = useState<Direction>('pl-en')
  const [text, setText] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<TranslateErrorKind | null>(null)
  const [draft, setDraft] = useState<WordInput | null>(null)
  const [justSaved, setJustSaved] = useState(false)
  const abort = useRef<AbortController | null>(null)

  const [from, to] = direction === 'pl-en' ? ['PL', 'EN'] : ['EN', 'PL']

  async function run(source: string, dir: Direction) {
    abort.current?.abort()
    const ctrl = new AbortController()
    abort.current = ctrl
    setBusy(true)
    setError(null)
    try {
      const out = await translate(source, dir, { url: workerUrl, signal: ctrl.signal })
      setResult({ source, text: out, direction: dir })
      setJustSaved(false)
    } catch (e) {
      if (e instanceof TranslateError) setError(e.kind)
      else if ((e as Error).name !== 'AbortError') setError('worker_down')
    } finally {
      if (abort.current === ctrl) setBusy(false)
    }
  }

  // tłumaczenie samo się odpala, kiedy przestaję pisać
  useEffect(() => {
    const source = text.trim()
    if (source.length < 2 || source.length > MAX_CHARS) return
    if (result && result.source === source && result.direction === direction) return
    const id = setTimeout(() => run(source, direction), DEBOUNCE_MS)
    return () => clearTimeout(id)
    // run i result celowo poza listą: liczy się tylko zmiana tekstu albo kierunku
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, direction])

  function swap() {
    const next: Direction = direction === 'pl-en' ? 'en-pl' : 'pl-en'
    // stare zapytanie mogłoby wrócić już po zamianie i nadpisać wynik złym kierunkiem
    abort.current?.abort()
    setBusy(false)
    // po zamianie wynik ląduje w polu, jak w zwykłym tłumaczu
    if (result) setText(result.text)
    setResult(null)
    setError(null)
    setDirection(next)
  }

  const pair = result && {
    term: result.source,
    translation: result.text,
    direction: result.direction,
  }
  const saved = pair ? !!findDuplicate(words, pair) : false
  const tooLong = text.length > MAX_CHARS

  return (
    <div className="sheet squared page-in translator">
      <div className="measure stack">
        <header className="hdr">
          <div className="stack">
            <p className="eyebrow">{t.eyebrow}</p>
            <h1 className="h-l">{t.title}</h1>
          </div>
          <Button size="sm" onClick={swap} aria-label={t.swap(from, to)}>
            {from}
            <Icon name="swap" size="s" />
            {to}
          </Button>
        </header>

        <div className="stack" style={{ marginTop: 16 }}>
          <label className="field-label" htmlFor="tr-src">
            {t.sourceLabel[direction]}
          </label>
          <textarea
            id="tr-src"
            className="line-area"
            rows={2}
            lang={direction === 'pl-en' ? 'pl' : 'en'}
            value={text}
            placeholder={t.placeholder[direction]}
            onChange={(e) => setText(e.target.value)}
            style={{ minHeight: 60 }}
          />
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
            <span className={`note ${tooLong ? '' : 'ink'}`} style={{ fontSize: 14 }}>
              {t.chars(text.length, MAX_CHARS)}
            </span>
            <Button
              variant="primary"
              disabled={busy || tooLong || !text.trim()}
              onClick={() => run(text.trim(), direction)}
            >
              {busy ? t.translating : t.translate}
            </Button>
          </div>
        </div>

        <div aria-live="polite">
          {error && (
            <Sticky color="p" tilt={1} tape={{ color: 'y', pos: 'tl' }} style={{ marginTop: 20 }}>
              <p className="small">{t.errors[error]}</p>
            </Sticky>
          )}

          {result && !error && (
            <Card tilt={-1} tape={{ color: 'y', pos: 'tl' }} className="tr-result">
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <p className="eyebrow">
                  {t.resultLabel(result.direction === 'pl-en' ? 'EN' : 'PL')}
                </p>
                <div className="row" style={{ gap: 0 }}>
                  {(saved || justSaved) && (
                    <span className="note stamp">{justSaved ? t.saved : t.alreadySaved}</span>
                  )}
                  {user ? (
                    <button
                      type="button"
                      className="ibtn star"
                      aria-pressed={saved}
                      aria-label={saved ? t.alreadySaved : t.save}
                      onClick={() =>
                        !saved && pair && setDraft({ ...pair, tags: [], source: 'translator' })
                      }
                    >
                      <Icon name="star" size="l" />
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="pen tr-out" lang={result.direction === 'pl-en' ? 'en' : 'pl'}>
                {result.text}
              </p>
              {!user && (
                <div className="row" style={{ gap: 6, alignItems: 'flex-start', marginTop: 6 }}>
                  <Doodle kind="curl" style={{ width: 28, height: 24, flex: 'none' }} />
                  <p className="note">
                    <Link to="/login" state={{ from: '/translator' }} className="red">
                      {t.loginToSave}
                    </Link>
                  </p>
                </div>
              )}
            </Card>
          )}

          {!result && !error && !text && (
            <p className="note ink" style={{ marginTop: 18 }}>
              {t.empty}
            </p>
          )}
        </div>
      </div>

      {user && words.length > 0 && (
        <TornSheet edge="t" className="tr-saved" sheetClassName="dotted tr-saved-in">
          <div className="hdr">
            <h2 className="h-m">
              {t.recent}{' '}
              <span className="hand pencil" style={{ fontSize: 24 }}>
                ({words.length})
              </span>
            </h2>
            <Link className="link-pen" to="/words">
              {t.allWords}
              <Icon name="next" size="s" />
            </Link>
          </div>
          <div className="note-grid">
            {words.slice(0, 6).map((w, i) => (
              <Sticky
                key={w.id}
                as="article"
                color={noteColors[i % noteColors.length]}
                tilt={tilts[i % tilts.length]}
                tape={{ color: (['y', 'p', 'b', 'm'] as const)[i % 4] }}
                className="saved-note"
              >
                <p className="h-s" lang="en" style={{ fontSize: 21 }}>
                  {englishSide(w)}
                </p>
                <p className="small muted">{polishSide(w)}</p>
                {w.tags[0] && (
                  <span className="tag" style={{ marginTop: 'auto', alignSelf: 'flex-start' }}>
                    {w.tags[0]}
                  </span>
                )}
              </Sticky>
            ))}
          </div>
        </TornSheet>
      )}

      <SaveWordSheet
        draft={draft}
        onClose={() => setDraft(null)}
        onSaved={() => setJustSaved(true)}
      />
    </div>
  )
}
