import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { Button, LineField, TagButton } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Card, type NoteColor } from '../../components/Paper'
import { pl } from '../../i18n/pl'
import type { WordInput } from '../../lib/db/words'
import { buildOwnCard, englishSide, findDuplicate } from '../../lib/vocab'
import { useWords } from './useWords'

// kolory w tej samej kolejności co etykiety w pl.ts
const tagColors: NoteColor[] = ['y', 'p', 'b', 'o', 'm']

export function NewCardForm({
  onSave,
  onClose,
}: {
  onSave: (input: WordInput, keepOpen: boolean) => void
  onClose: () => void
}) {
  const t = pl.words.newCard
  const { words } = useWords()
  const headId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [en, setEn] = useState('')
  const [plText, setPl] = useState('')
  const [example, setExample] = useState('')
  const [tag, setTag] = useState(t.tags[0]!)
  // null = pole na nową etykietę zamknięte
  const [custom, setCustom] = useState<string | null>(null)
  const [error, setError] = useState(false)

  const fields = { en, pl: plText, example, tag: custom ?? tag }
  const dupe = findDuplicate(words, { term: en, translation: plText, direction: 'en-pl' })

  function edit(set: (v: string) => void) {
    return (v: string) => {
      set(v)
      setError(false)
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const keepOpen = (e.nativeEvent as SubmitEvent).submitter?.dataset.next === '1'
    const card = buildOwnCard(fields)
    if (!card) return setError(true)
    if (dupe) return
    onSave(card, keepOpen)
    setEn('')
    setPl('')
    setExample('')
    if (keepOpen) formRef.current?.querySelector('input')?.focus()
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }

  return (
    <Card
      as="section"
      tilt={-1}
      tape={{ color: 'm' }}
      className="new-card"
      aria-labelledby={headId}
      onKeyDown={onKeyDown}
    >
      <div className="row new-card-head">
        <div className="stack" style={{ gap: 0 }}>
          <h2 id={headId} className="h-m">
            {t.title}
          </h2>
          <span className="note ink new-card-sub">{t.sub}</span>
        </div>
        <button type="button" className="ibtn" aria-label={t.close} onClick={onClose}>
          <Icon name="cross" />
        </button>
      </div>

      <form ref={formRef} className="stack new-card-form" onSubmit={submit} noValidate>
        <LineField
          label={t.english}
          value={en}
          placeholder={t.englishPlaceholder}
          onChange={(e) => edit(setEn)(e.target.value)}
          lang="en"
          autoComplete="off"
          aria-invalid={error && !en.trim()}
        />
        <LineField
          label={t.polish}
          value={plText}
          placeholder={t.polishPlaceholder}
          onChange={(e) => edit(setPl)(e.target.value)}
          lang="pl"
          autoComplete="off"
          aria-invalid={error && !plText.trim()}
        />
        <LineField
          label={t.example}
          value={example}
          placeholder={t.examplePlaceholder}
          onChange={(e) => setExample(e.target.value)}
          lang="en"
          autoComplete="off"
          className="new-card-example"
        />

        <div>
          <p className="field-label">{t.tag}</p>
          <div className="row wrap new-card-tags" role="group" aria-label={t.tagGroup}>
            {t.tags.map((x, i) => (
              <TagButton
                key={x}
                pressed={custom === null && tag === x}
                color={tagColors[i]}
                onClick={() => {
                  setTag(x)
                  setCustom(null)
                }}
              >
                {x}
              </TagButton>
            ))}
            <TagButton pressed={custom !== null} onClick={() => setCustom(custom ?? '')}>
              {t.newTag}
            </TagButton>
          </div>
          {custom !== null && (
            <LineField
              label={t.newTagLabel}
              value={custom}
              placeholder={t.newTagPlaceholder}
              onChange={(e) => setCustom(e.target.value)}
              autoCapitalize="off"
              autoComplete="off"
              autoFocus
              className="new-card-newtag"
            />
          )}
        </div>

        <div className="stack" style={{ gap: 4 }}>
          <p className="field-label">{t.preview}</p>
          <div className="row new-card-preview">
            <Preview label={t.front} value={en} empty={t.frontEmpty} lang="en" tilt={-1} />
            <Preview label={t.back} value={plText} empty={t.backEmpty} lang="pl" tilt={1} />
          </div>
        </div>

        {error && (
          <p className="note" role="alert">
            {t.error}
          </p>
        )}
        {dupe && (
          <p className="note" role="alert">
            {pl.words.duplicate}{' '}
            <Link className="link-pen" to={`/words?q=${encodeURIComponent(englishSide(dupe))}`}>
              {pl.words.showIt}
            </Link>
          </p>
        )}

        <div className="row wrap new-card-actions">
          <Button type="submit" variant="primary">
            {t.save}
          </Button>
          <button type="submit" className="link-pen" data-next="1">
            {t.saveNext}
          </button>
        </div>
        <p className="note ink new-card-keys">{t.keys}</p>
      </form>
    </Card>
  )
}

function Preview({
  label,
  value,
  empty,
  lang,
  tilt,
}: {
  label: string
  value: string
  empty: string
  lang: string
  tilt: -1 | 1
}) {
  const v = value.trim()
  return (
    <Card variant="index-card" tilt={tilt} className="new-card-side">
      <span className="eyebrow">{label}</span>
      <span className={v ? 'pen' : 'pencil hand'} lang={v ? lang : 'pl'}>
        {v || empty}
      </span>
    </Card>
  )
}
