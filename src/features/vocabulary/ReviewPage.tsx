import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button, Progress } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { Sticky } from '../../components/Paper'
import { Loading, NoteState } from '../../components/States'
import { pl } from '../../i18n/pl'
import { saveReview } from '../../lib/db/words'
import { dueCards, leeches, nextDue, review } from '../../lib/srs'
import { DRAG_START_PX, swipeAnswer, swipeProgress } from '../../lib/swipe'
import { englishSide, polishSide } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { useWords } from './useWords'
import { SpellPad } from './SpellPad'
import { WordStats } from './WordStats'

type Dir = 'pl-en' | 'en-pl'
const DIR_KEY = 'mtg-review-dir'

function savedDir(): Dir {
  try {
    return localStorage.getItem(DIR_KEY) === 'en-pl' ? 'en-pl' : 'pl-en'
  } catch {
    return 'pl-en'
  }
}

// długie zwroty nie mieszczą się 46 px na karcie
function bigSize(text: string) {
  if (text.length > 60) return 26
  if (text.length > 30) return 34
  return 46
}

export function ReviewPage() {
  const { user } = useAuth()
  const { words, loading } = useWords()
  const [params] = useSearchParams()
  const leechMode = params.get('mode') === 'leeches'
  const [dir, setDir] = useState<Dir>(savedDir)
  // talia zamrożona po pierwszej odpowiedzi, żeby powtórzone karty nie znikały spod palca
  const [frozen, setFrozen] = useState<string[] | null>(null)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [again, setAgain] = useState(0)
  const [dx, setDx] = useState(0)
  const [width, setWidth] = useState(1)
  const drag = useRef<{ x: number; id: number; moved: boolean } | null>(null)
  const t = pl.review

  const byId = useMemo(() => new Map(words.map((w) => [w.id, w])), [words])
  const live = useMemo(
    () => (leechMode ? leeches(words) : dueCards(words, new Date())).map((w) => w.id),
    [words, leechMode],
  )
  const deckIds = frozen ?? live
  const cards = deckIds.flatMap((id) => byId.get(id) ?? [])
  const card = cards[i]
  const total = cards.length

  function answer(knew: boolean) {
    if (!card || !user) return
    if (!frozen) setFrozen(deckIds)
    saveReview(user.uid, card.id, review(card, knew, new Date()))
    if (knew) setKnown((k) => k + 1)
    else setAgain((a) => a + 1)
    setFlipped(false)
    setDx(0)
    setI((n) => n + 1)
  }

  function toggleDir() {
    const next: Dir = dir === 'pl-en' ? 'en-pl' : 'pl-en'
    setDir(next)
    setFlipped(false)
    try {
      localStorage.setItem(DIR_KEY, next)
    } catch {
      // bez zapamiętania kierunku też się da
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      // strzałki w polu do pisania przesuwają kursor, a nie oceniają kartę
      if (!flipped || e.target instanceof HTMLInputElement) return
      if (e.key === 'ArrowRight') answer(true)
      if (e.key === 'ArrowLeft') answer(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  function onDown(e: PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0) return
    drag.current = { x: e.clientX, id: e.pointerId, moved: false }
    setWidth(e.currentTarget.offsetWidth)
  }
  function onMove(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current
    if (!d || d.id !== e.pointerId || !flipped) return
    const delta = e.clientX - d.x
    if (!d.moved) {
      if (Math.abs(delta) < DRAG_START_PX) return
      d.moved = true
      // palec może zjechać poza kartę, a ruch dalej ma się liczyć
      e.currentTarget.setPointerCapture(e.pointerId)
    }
    setDx(delta)
  }
  function onUp(e: PointerEvent<HTMLButtonElement>) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    // flagę „moved” czyta jeszcze onClick, więc czyścimy ją dopiero po nim
    setTimeout(() => (drag.current = null))
    if (!d.moved) return
    const knew = swipeAnswer(e.clientX - d.x, width)
    if (knew === null) setDx(0)
    else answer(knew)
  }
  function onCancel() {
    // przeglądarka zabrała gest (np. przewijanie w pionie)
    drag.current = null
    setDx(0)
  }

  if (!user) return null
  if (loading) return <Loading />

  const pl2en = dir === 'pl-en'
  const front = card && (pl2en ? polishSide(card) : englishSide(card))
  const back = card && (pl2en ? englishSide(card) : polishSide(card))

  let empty: string | null = null
  if (!words.length) empty = t.noWords
  else if (!total) {
    if (leechMode) empty = t.noLeeches
    else {
      const next = nextDue(words, new Date())
      empty = next ? `${t.nothingDue} ${t.nextDue(pl.words.dueIn(next, new Date()))}` : t.nothingDue
    }
  }

  return (
    <div className="review">
      <header className="row" style={{ justifyContent: 'space-between' }}>
        <Link className="ibtn" to={leechMode ? '/leeches' : '/words'} aria-label={t.close}>
          <Icon name="cross" />
        </Link>
        <h1 className="h-m">{leechMode ? t.leechTitle : t.title}</h1>
        <Button size="sm" onClick={toggleDir} aria-label={t.dirLabel(t.dir[dir])}>
          {t.dir[dir]}
        </Button>
      </header>

      {empty ? (
        <div className="center-note">
          <NoteState title={empty} color="m" tilt={-1}>
            <Link className="link-pen" to="/words">
              {t.toList}
            </Link>
          </NoteState>
        </div>
      ) : (
        <>
          <div className="row" style={{ gap: 12, marginTop: 10 }}>
            <span className="hand" style={{ fontSize: 22, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {card ? t.pos(i + 1, total) : t.finished}
            </span>
            <span className="grow">
              <Progress value={Math.min(i, total) / total} />
            </span>
          </div>
          <p className="note ink" style={{ fontSize: 14, marginTop: 2 }}>
            {t.counts(known, again)}
          </p>

          {card ? (
            <>
              <div className="review-stage">
                <span aria-hidden="true" className="deck-under a" />
                <span aria-hidden="true" className="deck-under b" />
                <button
                  key={card.id + dir}
                  type="button"
                  className={`flip${flipped ? ' on' : ''}${dx ? ' dragging' : ''}`}
                  aria-label={flipped ? t.flipBack : t.flipFront}
                  onClick={() => {
                    if (!drag.current?.moved) setFlipped(!flipped)
                  }}
                  onPointerDown={onDown}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={onCancel}
                  style={{
                    transform: dx ? `translateX(${dx}px) rotate(${dx / 25}deg)` : undefined,
                  }}
                >
                  {dx !== 0 && (
                    <span
                      aria-hidden="true"
                      className={`swipe-stamp ${dx > 0 ? 'knew' : 'didnt'}`}
                      style={{ opacity: Math.abs(swipeProgress(dx, width)) }}
                    >
                      {dx > 0 ? t.knew : t.didnt}
                    </span>
                  )}
                  <span className="flip-in">
                    <span className="face index-card review-face">
                      <span className="row" style={{ justifyContent: 'space-between', height: 32 }}>
                        {card.tags[0] ? <span className="tag tg-b">{card.tags[0]}</span> : <span />}
                        <span className="eyebrow">{pl2en ? 'PL' : 'EN'}</span>
                      </span>
                      <span
                        className="h-xl review-big"
                        lang={pl2en ? 'pl' : 'en'}
                        style={{ fontSize: bigSize(front ?? '') }}
                      >
                        {front}
                      </span>
                      <span className="row note ink" style={{ gap: 6, justifyContent: 'center' }}>
                        <Icon name="flip" size="s" />
                        {t.tapToFlip}
                      </span>
                    </span>
                    <span className="face back index-card review-face">
                      <span className="row" style={{ justifyContent: 'space-between', height: 32 }}>
                        <span className="eyebrow">{pl2en ? 'EN' : 'PL'}</span>
                        {card.tags[0] && <span className="tag tg-b">{card.tags[0]}</span>}
                      </span>
                      <span className="stack" style={{ gap: 14, alignItems: 'center' }}>
                        <span
                          className="h-xl pen review-big"
                          lang={pl2en ? 'en' : 'pl'}
                          style={{ fontSize: bigSize(back ?? ''), fontWeight: 700 }}
                        >
                          {back}
                        </span>
                        <Scribble width={150} />
                      </span>
                      <span className="stack" style={{ gap: 2 }}>
                        {card.example && (
                          <>
                            <span className="eyebrow">{t.example}</span>
                            <span
                              className="body-l"
                              lang="en"
                              style={{ fontSize: 19, lineHeight: '28px' }}
                            >
                              {card.example}
                            </span>
                          </>
                        )}
                        <WordStats word={card} />
                      </span>
                    </span>
                  </span>
                </button>
              </div>

              <SpellPad
                key={card.id + dir}
                answer={back ?? ''}
                lang={pl2en ? 'en' : 'pl'}
                flipped={flipped}
                onReveal={() => setFlipped(true)}
              />

              <div style={{ marginTop: 22 }}>
                {flipped ? (
                  <div className="answer-grid">
                    <Button variant="pink" onClick={() => answer(false)}>
                      {t.didnt}
                    </Button>
                    <Button variant="mint" onClick={() => answer(true)}>
                      <Icon name="check" />
                      {t.knew}
                    </Button>
                  </div>
                ) : (
                  <Button variant="primary" block onClick={() => setFlipped(true)}>
                    <Icon name="flip" />
                    {t.flip}
                  </Button>
                )}
              </div>
              <p className="note ink" style={{ textAlign: 'center', marginTop: 14, fontSize: 14 }}>
                {t.swipeHint}
              </p>
            </>
          ) : (
            <Sticky
              color="m"
              tilt={-1}
              tape={{ color: 'y' }}
              style={{ marginTop: 40, padding: '28px 20px 24px' }}
            >
              <p className="h-l">{t.endTitle}</p>
              <p className="body-l" style={{ marginTop: 8 }}>
                {t.endText(known, total)}
              </p>
              <div className="row" style={{ gap: 12, marginTop: 18 }}>
                <Link className="btn btn-primary" to="/words">
                  {t.toList}
                </Link>
              </div>
            </Sticky>
          )}
        </>
      )}
    </div>
  )
}
