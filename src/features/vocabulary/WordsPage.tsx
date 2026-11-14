import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SearchField, TagButton } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { Sheet } from '../../components/Sheet'
import { Loading, NoteState } from '../../components/States'
import { pl } from '../../i18n/pl'
import { updateWord, type Word } from '../../lib/db/words'
import { accuracy, dueCards, leeches } from '../../lib/srs'
import { englishSide, normalizeText, polishSide } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { useWords } from './useWords'
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
  const { words, loading } = useWords()
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState<Sort>('newest')
  const [tag, setTag] = useState<string | null>(null)
  const [editing, setEditing] = useState<Word | null>(null)
  const q = params.get('q') ?? ''
  const t = pl.words
  // „teraz” liczone przy każdym renderze: lista i tak odświeża się z każdą zmianą w bazie
  const now = new Date()

  const allTags = useMemo(() => [...new Set(words.flatMap((w) => w.tags))].sort(), [words])
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

      <div className="row wrap" style={{ gap: 12, marginTop: 14 }}>
        <Link className="btn btn-mint" to="/review" aria-disabled={due === 0}>
          <Icon name="flip" />
          {due ? t.review(due) : t.nothingDue}
        </Link>
        {leechCount > 0 && (
          <Link className="link-pen red" to="/leeches">
            {t.leeches(leechCount)}
          </Link>
        )}
      </div>

      {words.length === 0 ? (
        <div style={{ marginTop: 26 }}>
          <NoteState title={t.empty} color="b" tilt={1}>
            <Link className="link-pen" to="/translator">
              {t.toTranslator}
            </Link>
          </NoteState>
        </div>
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
                <WordRow key={w.id} word={w} uid={user.uid} now={now} onEdit={setEditing} />
              ))}
            </ul>
          ) : (
            <p className="note ink" style={{ marginTop: 16 }}>
              {t.noResults}
            </p>
          )}
        </>
      )}

      <Sheet open={!!editing} onClose={() => setEditing(null)} title={t.editTitle}>
        {editing && (
          <WordForm
            key={editing.id}
            initial={editing}
            submitLabel={t.editSave}
            onSubmit={(input) => {
              updateWord(user.uid, editing.id, input)
              setEditing(null)
            }}
          />
        )}
      </Sheet>
    </div>
  )
}
