import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router'
import { Button, LineArea, LineField } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { pl } from '../../i18n/pl'
import { addWord } from '../../lib/db/words'
import {
  extractSentence,
  isEnglishLang,
  normalizeSelection,
  placePopover,
  type Rect,
} from '../../lib/text/pick'
import { translate, TranslateError, type TranslateErrorKind } from '../../lib/translate'
import { englishSide, findDuplicate, parseTags } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { useWords } from './useWords'

const workerUrl = import.meta.env.VITE_TRANSLATE_API_URL
// zaznaczenie musi chwilę postać, zanim pójdzie zapytanie do DeepL
const SETTLE_MS = 450
const blocks = 'p, li, blockquote, h1, h2, h3, h4, td, dd, dt, figcaption'

type Picked = { term: string; example: string; rect: Rect }

// to samo słówko drugi raz nie zjada limitu znaków
const cache = new Map<string, Promise<string>>()
function translateCached(text: string) {
  let p = cache.get(text)
  if (!p) {
    p = translate(text, 'en-pl', { url: workerUrl })
    cache.set(text, p)
    p.catch(() => cache.delete(text))
  }
  return p
}

// numerki luk, etykiety dla czytnika, podpowiedzi typu (go) i polskie wstawki nie wchodzą do przykładu
const skip = 'sup, .sr, .para-key, .ex-base, [aria-hidden="true"], [lang]:not([lang^="en"])'

// po sprawdzeniu luka dostaje dobrą odpowiedź, żeby przykład był całym zdaniem
function gapText(input: HTMLInputElement) {
  if (input.classList.contains('ok') && input.value.trim()) return input.value.trim()
  // przy złej odpowiedzi zaraz za polem stoi .fix z poprawną, ona wejdzie jako zwykły tekst
  if (input.nextElementSibling?.classList.contains('fix')) return ''
  return '___'
}

function visibleText(block: Element, range: Range) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT)
  let text = ''
  let start: number | undefined
  let end: number | undefined
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n instanceof Element) {
      // luka w zdaniu z ćwiczenia
      if (n instanceof HTMLInputElement) text += gapText(n)
      continue
    }
    const hidden = n.parentElement?.closest(skip)
    if (hidden && block.contains(hidden)) continue
    if (start === undefined) {
      if (n === range.startContainer) start = text.length + range.startOffset
      else if (range.comparePoint(n, 0) >= 0) start = text.length
    }
    if (end === undefined) {
      if (n === range.endContainer) end = text.length + range.endOffset
      else if (range.comparePoint(n, 0) > 0) end = text.length
    }
    text += n.textContent ?? ''
  }
  start ??= text.length
  return { text, start, end: Math.max(start, end ?? text.length) }
}

function readSelection(popover: HTMLElement | null): Picked | null {
  const sel = document.getSelection()
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null
  const active = document.activeElement
  if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return null
  const range = sel.getRangeAt(0)
  const common = range.commonAncestorContainer
  const el = common instanceof Element ? common : common.parentElement
  if (!el || popover?.contains(el)) return null
  if (el.closest('input, textarea, select, [contenteditable], dialog')) return null

  const root = el.closest('[lang]')
  if (!root || !isEnglishLang(root.getAttribute('lang'))) return null
  // polskie tłumaczenie w środku angielskiego bloku też odpada
  for (const inner of root.querySelectorAll('[lang]')) {
    if (!isEnglishLang(inner.getAttribute('lang')) && range.intersectsNode(inner)) return null
  }

  const raw = range.toString()
  const term = normalizeSelection(raw)
  if (!term) return null

  const found = el.closest(blocks)
  const block = found && root.contains(found) ? found : root
  const { text, start, end } = visibleText(block, range)
  const example = extractSentence(text, start, end)

  const r = range.getBoundingClientRect()
  return { term, example, rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right } }
}

const keyOf = (p: Picked) => `${p.term}|${p.example}`

// jeden na całą aplikację: zaznaczasz angielski tekst i od razu masz fiszkę
export function PickWord() {
  const [picked, setPicked] = useState<Picked | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const current = useRef<Picked | null>(null)
  const dismissed = useRef<string | null>(null)
  const mouseDown = useRef(false)
  const touch = useRef(false)

  useEffect(() => {
    current.current = picked
  }, [picked])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined

    function check() {
      const next = readSelection(ref.current)
      if (!next) return
      const key = keyOf(next)
      if (key === dismissed.current) return
      if (current.current && keyOf(current.current) === key) return
      setPicked(next)
    }
    function schedule(ms: number) {
      clearTimeout(timer)
      timer = setTimeout(check, ms)
    }
    function close() {
      if (!current.current) return
      dismissed.current = keyOf(current.current)
      setPicked(null)
    }

    function onSelectionChange() {
      const sel = document.getSelection()
      if (!sel || sel.isCollapsed) {
        // puste zaznaczenie nie zamyka dymka: to zwykle klik w pole tłumaczenia
        dismissed.current = null
        clearTimeout(timer)
        return
      }
      if (mouseDown.current) return
      schedule(SETTLE_MS)
    }
    function onPointerDown(e: PointerEvent) {
      touch.current = e.pointerType !== 'mouse'
      if (e.pointerType === 'mouse') mouseDown.current = true
      if (!ref.current?.contains(e.target as Node)) close()
    }
    function onPointerUp(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      mouseDown.current = false
      // podwójny klik zaznacza słowo dopiero po chwili
      schedule(200)
    }
    function onTouchEnd() {
      touch.current = true
      schedule(SETTLE_MS)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    function onScroll(e: Event) {
      const pop = ref.current
      if (!pop || pop.contains(e.target as Node) || pop.contains(document.activeElement)) return
      close()
    }

    document.addEventListener('selectionchange', onSelectionChange)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('pointerup', onPointerUp, true)
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('keydown', onKey)
    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => {
      clearTimeout(timer)
      document.removeEventListener('selectionchange', onSelectionChange)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('pointerup', onPointerUp, true)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('scroll', onScroll, true)
    }
  }, [])

  useLayoutEffect(() => {
    const pop = ref.current
    if (!pop || !picked) return
    function place() {
      if (!pop || !picked) return
      const { top, left, maxHeight } = placePopover(
        picked.rect,
        // scrollHeight, bo przy uciętej wysokości offsetHeight kłamie
        { width: pop.offsetWidth, height: Math.max(pop.offsetHeight, pop.scrollHeight + 3) },
        { width: window.innerWidth, height: window.innerHeight },
        // na telefonie pod zaznaczeniem wiszą jeszcze uchwyty
        { gap: touch.current ? 30 : 10 },
      )
      pop.style.top = `${top}px`
      pop.style.left = `${left}px`
      pop.style.maxHeight = maxHeight ? `${maxHeight}px` : ''
    }
    place()
    const obs = new ResizeObserver(place)
    obs.observe(pop)
    return () => obs.disconnect()
  }, [picked])

  const closeCard = useCallback(() => {
    if (current.current) dismissed.current = keyOf(current.current)
    setPicked(null)
  }, [])

  if (!picked) return null
  // portal, bo .app ma własny układ i fixed liczyłby się od niego, a nie od ekranu
  return createPortal(
    <div ref={ref} className="pick-pop" role="dialog" aria-label={pl.pick.label}>
      <PickCard
        key={keyOf(picked)}
        term={picked.term}
        example={picked.example}
        onClose={closeCard}
      />
    </div>,
    document.body,
  )
}

function PickCard({
  term,
  example,
  onClose,
}: {
  term: string
  example: string
  onClose: () => void
}) {
  const t = pl.pick
  const { user } = useAuth()
  const { words } = useWords()
  const { pathname, search } = useLocation()
  const [translation, setTranslation] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<TranslateErrorKind | null>(null)
  const [tag, setTag] = useState('')
  const [sentence, setSentence] = useState(example === term ? '' : example)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let alive = true
    translateCached(term)
      .then((out) => {
        if (alive) setTranslation((prev) => prev || out)
      })
      .catch((e) => {
        if (alive) setError(e instanceof TranslateError ? e.kind : 'worker_down')
      })
      .finally(() => {
        if (alive) setBusy(false)
      })
    return () => {
      alive = false
    }
  }, [term])

  useEffect(() => {
    if (!saved) return
    const id = setTimeout(onClose, 1400)
    return () => clearTimeout(id)
  }, [saved, onClose])

  const dupe = saved ? undefined : findDuplicate(words, { term, translation, direction: 'en-pl' })

  function save() {
    if (!user || !translation.trim() || dupe) return
    addWord(user.uid, {
      term,
      translation,
      direction: 'en-pl',
      example: sentence,
      tags: parseTags(tag),
      source: 'text',
    })
    document.getSelection()?.removeAllRanges()
    setSaved(true)
  }

  return (
    <>
      <div className="row pick-head">
        <p className="eyebrow">{t.title}</p>
        <button type="button" className="ibtn" aria-label={pl.common.close} onClick={onClose}>
          <Icon name="cross" size="s" />
        </button>
      </div>
      <p className="h-s pick-term" lang="en">
        {term}
      </p>

      {user ? (
        <LineField
          label={t.translation}
          value={translation}
          placeholder={busy ? t.translating : undefined}
          onChange={(e) => setTranslation(e.target.value)}
          lang="pl"
          disabled={saved}
        />
      ) : (
        <p className="pen pick-tr" lang="pl" aria-live="polite">
          {busy ? <span className="pencil">{t.translating}</span> : translation}
        </p>
      )}
      <div aria-live="polite">
        {error && <p className="note pick-msg">{pl.translator.errors[error]}</p>}
      </div>

      {user
        ? !saved && (
            <LineArea
              className="pick-example"
              label={t.example}
              value={sentence}
              rows={2}
              placeholder={t.examplePlaceholder}
              onChange={(e) => setSentence(e.target.value)}
              lang="en"
            />
          )
        : example &&
          example !== term && (
            <div className="pick-example">
              <p className="field-label">{t.example}</p>
              <p className="small" lang="en">
                {example}
              </p>
            </div>
          )}

      {!user ? (
        <p className="note pick-msg">
          <Link to="/login" state={{ from: pathname + search }} className="red" onClick={onClose}>
            {pl.translator.loginToSave}
          </Link>
        </p>
      ) : saved ? (
        <p className="note stamp pick-done" role="status">
          {t.saved}
        </p>
      ) : (
        <>
          {dupe && (
            <p className="note pick-msg" role="alert">
              {pl.words.duplicate}{' '}
              <Link
                className="link-pen"
                to={`/words?q=${encodeURIComponent(englishSide(dupe))}`}
                onClick={onClose}
              >
                {pl.words.showIt}
              </Link>
            </p>
          )}
          <div className="row pick-save">
            <LineField
              label={t.tag}
              value={tag}
              placeholder={t.tagPlaceholder}
              onChange={(e) => setTag(e.target.value)}
              autoCapitalize="off"
            />
            <Button variant="mint" disabled={!translation.trim() || !!dupe} onClick={save}>
              <Icon name="plus" size="s" />
              {t.save}
            </Button>
          </div>
        </>
      )}
    </>
  )
}
