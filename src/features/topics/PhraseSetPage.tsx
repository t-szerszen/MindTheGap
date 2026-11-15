import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { SearchField } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { Card, type Tilt } from '../../components/Paper'
import { NotFound } from '../../components/States'
import type { PhraseItem, PhraseSet } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { usePhraseSets } from '../../lib/content'
import type { WordInput } from '../../lib/db/words'
import { findDuplicate, normalizeText } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { ExampleLine } from '../tenses/ExampleLine'
import { SaveWordSheet } from '../vocabulary/SaveWordSheet'
import { useWords } from '../vocabulary/useWords'

const tilts: Tilt[] = [-1, 1, 0, 1, -1, 0]

function draftFrom(set: PhraseSet, item: PhraseItem): WordInput {
  return {
    term: item.en,
    translation: item.pl,
    direction: 'en-pl',
    example: item.example.en,
    tags: [pl.topics.setTag[set.category], ...(item.tags ?? [])],
  }
}

export function PhraseSetPage() {
  const { id = '' } = useParams()
  const set = usePhraseSets().find((s) => s.id === id)
  const { user } = useAuth()
  const { words } = useWords()
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState<WordInput | null>(null)
  if (!set) return <NotFound />
  const t = pl.topics

  const nq = normalizeText(q)
  const items = set.items.filter(
    (i) => !nq || normalizeText(`${i.en} ${i.pl} ${i.meaning_pl ?? ''}`).includes(nq),
  )

  return (
    <div className="sheet dotted page-in">
      <div className="measure stack">
        <Link className="link-pen" to="/more" style={{ alignSelf: 'flex-start', marginLeft: -4 }}>
          <Icon name="back" size="s" />
          {pl.nav.more}
        </Link>
        <p className="eyebrow">{t.setCategories[set.category]}</p>
        <h1 className="h-l">{set.title_pl}</h1>
        <Scribble width={200} />
        <div style={{ marginTop: 14 }}>
          <SearchField label={t.searchLabel} placeholder={t.search} value={q} onChange={setQ} />
        </div>

        <ul className="phrase-list">
          {items.map((item, i) => {
            const saved = !!findDuplicate(words, draftFrom(set, item))
            return (
              <Card
                key={item.en}
                as="li"
                variant="index-card"
                tilt={tilts[i % tilts.length]}
                className="phrase"
              >
                <div className="row" style={{ justifyContent: 'space-between', height: 34 }}>
                  <p className="h-s" lang="en">
                    {item.en}
                  </p>
                  {item.register && item.register !== 'neutral' && (
                    <span className={`tag ${item.register === 'formal' ? 'tg-b' : 'tg-o'}`}>
                      {t.register[item.register]}
                    </span>
                  )}
                </div>
                <p className="small" style={{ lineHeight: '28px' }}>
                  {item.pl}
                </p>
                {item.meaning_pl && (
                  <p className="note ink" style={{ lineHeight: '28px' }}>
                    {item.meaning_pl}
                  </p>
                )}
                <ExampleLine ex={item.example} signals={[item.en.toLowerCase()]} />
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  {saved ? (
                    <span className="note blue row" style={{ gap: 4, minHeight: 44 }}>
                      <Icon name="check" size="s" />
                      {t.inCards}
                    </span>
                  ) : user ? (
                    <button
                      type="button"
                      className="link-pen"
                      onClick={() => setDraft(draftFrom(set, item))}
                    >
                      <Icon name="plus" size="s" />
                      {t.addToCards}
                    </button>
                  ) : (
                    <Link className="link-pen" to="/login" state={{ from: `/phrases/${set.id}` }}>
                      <Icon name="plus" size="s" />
                      {t.addToCards}
                    </Link>
                  )}
                </div>
              </Card>
            )
          })}
        </ul>
        {items.length === 0 && <p className="note ink">{pl.words.noResults}</p>}
      </div>
      <SaveWordSheet draft={draft} onClose={() => setDraft(null)} />
    </div>
  )
}
