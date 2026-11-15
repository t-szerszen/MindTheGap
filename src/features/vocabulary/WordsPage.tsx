import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SearchField, TagButton } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { Sheet } from '../../components/Sheet'
import { Sticky } from '../../components/Paper'
import { Loading } from '../../components/States'
import { pl } from '../../i18n/pl'
import { addWord, updateWord, type Word, type WordInput } from '../../lib/db/words'
import { accuracy, dueCards, leeches } from '../../lib/srs'
import { englishSide, normalizeText, polishSide } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { useWords } from './useWords'
import { NewCardForm } from './NewCardForm'
import { WordForm } from './WordForm'
import { WordRow } from './WordRow'

type Sort = 'newest' | 'accuracy' | 'due'

function sortWords(words: Word[], sort: Sort) {
  const list = [...words]
  if (sort === 'accuracy')
    // nowe słówka (bez prób) na końcu, żeby nie udawały najgorszych
    list.sort((a, b) => (accuracy(a) ?? 2) - (accuracy(b) ?? 2))
  if (sort === 'due') list.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
  return list
}

export function WordsPage() {
  const { user } = useAuth()
  const { words, loading, error } = useWords()
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState<Sort>('newest')
  const [tag, setTag] = useState<string | null>(null)
  const [editing, setEditing] = useState<Word | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  // id fiszek dodanych w tej wizycie, dostają dopisek „nowe!”
  const [recent, setRecent] = useState<string[]>([])
  const [added, setAdded] = useState<string | null>(null)
  const addBtn = useRef<HTMLButtonElement>(null)
  const q = params.get('q') ?? ''
  const t = pl.words
  // „teraz” liczone przy każdym renderze: lista i tak odświeża się z każdą zmianą w bazie
  const now = new Date()

  const allTags = [...new Set(words.flatMap((w) => w.tags))].sort()
  const due = dueCards(words, now).length
  const leechCount = leeches(words).length

  const shown = useMemo(() => {
    const nq = normalizeText(q)
    const filtered = words.filter(
      (w) =>
        (!tag || w.tags.includes(tag)) &&
        (!nq ||
          normalizeText(`${englishSide(w)} ${polishSide(w)} ${w.example ?? ''}`).includes(nq)),
    )
    return sortWords(filtered, sort)
  }, [words, q, tag, sort])

  if (!user) return null
  if (loading) return <Loading />
  const uid = user.uid

  function closeForm() {
    setFormOpen(false)
    addBtn.current?.focus()
  }

  function saveOwn(input: WordInput, keepOpen: boolean) {
    const id = addWord(uid, input)
    if (id) setRecent((r) => [id, ...r])
    setAdded(englishSide(input))
    if (!keepOpen) closeForm()
  }

  return (
    <div className="measure stack">
      <header className="hdr wrap">
        <div className="stack">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="h-l">
            {t.title}{' '}
            <span className="hand pencil" style={{ fontSize: 26 }}>
              ({words.length})
            </span>
          </h1>
          <Scribble width={200} />
        </div>
      </header>

      {error && (
        <p className="note" role="alert" style={{ marginTop: 8 }}>
          {pl.settings.syncError}
        </p>
      )}

      <div className="row wrap" style={{ gap: 12, marginTop: 14 }}>
        <button
          ref={addBtn}
          type="button"
          className="btn btn-primary"
          aria-expanded={formOpen}
          onClick={() => (formOpen ? closeForm() : setFormOpen(true))}
        >
          <Icon name="plus" size="s" />
          {t.add}
        </button>
        {due > 0 ? (
          <Link className="btn btn-mint" to="/review">
            <Icon name="flip" />
            {t.review(due)}
          </Link>
        ) : (
          <button type="button" className="btn" disabled>
            {words.length ? t.nothingDue : t.noCards}
          </button>
        )}
        {leechCount > 0 && (
          <Link className="link-pen red" to="/leeches">
            {t.leeches(leechCount)}
          </Link>
        )}
      </div>

      <div className={formOpen ? 'words-layout with-form' : 'words-layout'}>
        {formOpen && <NewCardForm onSave={saveOwn} onClose={closeForm} />}
        <div className="words-main">
          {added && (
            <p className="note green" role="status">
              <b className="hand words-added">{t.added}</b> {t.addedText(added)}
            </p>
          )}
          {words.length === 0 ? (
            <Sticky color="b" tilt={-1} tape={{ color: 'm' }} className="words-empty">
              <h2 className="h-m">{t.empty}</h2>
              <p className="body-l">{t.emptyHint}</p>
              <Link className="link-pen" to="/translator">
                {t.toTranslator}
              </Link>
            </Sticky>
          ) : (
            <>
              <div style={{ marginTop: 18 }}>
                <SearchField
                  label={t.searchLabel}
                  placeholder={t.search}
                  value={q}
                  onChange={(v) => setParams(v ? { q: v } : {}, { replace: true })}
                />
              </div>
              <div className="row chips" role="group" aria-label={t.sortLabel}>
                {(Object.keys(t.sort) as Sort[]).map((s) => (
                  <TagButton key={s} pressed={sort === s} onClick={() => setSort(s)}>
                    {t.sort[s]}
                  </TagButton>
                ))}
              </div>
              {allTags.length > 0 && (
                <div className="row chips" role="group" aria-label={t.tagsLabel}>
                  <TagButton pressed={!tag} color="y" onClick={() => setTag(null)}>
                    {t.allTags}
                  </TagButton>
                  {allTags.map((x) => (
                    <TagButton key={x} pressed={tag === x} color="b" onClick={() => setTag(x)}>
                      {x}
                    </TagButton>
                  ))}
                </div>
              )}

              {shown.length ? (
                <ul className="word-list">
                  {shown.map((w) => (
                    <WordRow
                      key={w.id}
                      word={w}
                      uid={uid}
                      now={now}
                      fresh={recent.includes(w.id)}
                      onEdit={setEditing}
                    />
                  ))}
                </ul>
              ) : (
                <p className="note ink" style={{ marginTop: 16 }}>
                  {t.noResults}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={t.editTitle}>
        {editing && (
          <WordForm
            key={editing.id}
            initial={editing}
            submitLabel={t.editSave}
            onSubmit={(input) => {
              updateWord(uid, editing.id, input)
              setEditing(null)
            }}
          />
        )}
      </Sheet>
    </div>
  )
}
