import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { SearchField } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Card, Sticky, TornSheet } from '../../components/Paper'
import { pl } from '../../i18n/pl'
import { usePhraseSets, useTopics } from '../../lib/content'
import { normalizeText } from '../../lib/vocab'
import { shelves } from './hub'

type Entry = { key: string; to: string; title: string; preview: ReactNode }

// każda półka wygląda trochę inaczej, jak w projekcie: karteczka, fiszka, wyrwana kartka, ramka
function ShelfPaper({ i, children }: { i: number; children: ReactNode }) {
  const kind = i % 4
  if (kind === 0)
    return (
      <Sticky
        color={(['p', 'm', 'b'] as const)[(i / 4) % 3]}
        tilt={-2}
        tape={{ color: 'y' }}
        className="shelf"
      >
        {children}
      </Sticky>
    )
  if (kind === 1)
    return (
      <Card variant="index-card" tilt={1} tape={{ color: 'b', pos: 'tr' }} className="shelf">
        {children}
      </Card>
    )
  if (kind === 2)
    return (
      <TornSheet className="r-1 shelf-torn" sheetClassName="shelf shelf-sheet">
        {children}
      </TornSheet>
    )
  return <section className="sk alt shelf shelf-sk">{children}</section>
}

export function MorePage() {
  const t = pl.more
  const [q, setQ] = useState('')
  const topics = useTopics()
  const sets = usePhraseSets()
  const nq = normalizeText(q)

  const entriesFor = (shelfId: string): Entry[] => {
    const shelf = shelves.find((s) => s.id === shelfId)!
    return [
      ...topics
        .filter((x) => shelf.topics.includes(x.category))
        .map((x) => ({
          key: x.id,
          to: `/topics/${x.id}`,
          title: x.title_pl,
          preview: <span className="small muted">{x.summary_pl}</span>,
        })),
      ...sets
        .filter((x) => shelf.sets.includes(x.category))
        .map((x) => ({
          key: x.id,
          to: `/phrases/${x.id}`,
          title: x.title_pl,
          preview: (
            <span className="small muted">
              <span lang="en">
                {x.items
                  .slice(0, 3)
                  .map((i) => i.en)
                  .join(' · ')}
              </span>{' '}
              · {t.phrases(x.items.length)}
            </span>
          ),
        })),
    ]
  }

  const results = nq
    ? [
        ...topics
          .filter((x) => normalizeText(`${x.title_pl} ${x.summary_pl}`).includes(nq))
          .map((x) => ({ key: x.id, to: `/topics/${x.id}`, title: x.title_pl, sub: x.summary_pl })),
        ...sets.flatMap((s) =>
          s.items
            .filter((i) => normalizeText(`${i.en} ${i.pl}`).includes(nq))
            .map((i) => ({
              key: `${s.id}:${i.en}`,
              to: `/phrases/${s.id}`,
              title: i.en,
              sub: i.pl,
            })),
        ),
      ]
    : []

  // „Inne” pokazujemy tylko, gdy coś tam jest
  const visible = shelves.filter((s) => s.id !== 'other' || entriesFor('other').length)

  return (
    <div className="sheet dotted plain page-in">
      <div className="measure stack">
        <header className="stack" style={{ gap: 2 }}>
          <p className="eyebrow">{pl.nav.more}</p>
          <h1 className="h-l">{t.title}</h1>
          <p className="note blue">{t.subtitle}</p>
        </header>

        <div style={{ marginTop: 14 }}>
          <SearchField label={t.searchLabel} placeholder={t.search} value={q} onChange={setQ} />
        </div>

        {nq ? (
          <ul className="stack search-results">
            {results.map((r) => (
              <li key={r.key}>
                <Link to={r.to} className="result-row">
                  <span className="h-s">{r.title}</span>
                  <span className="small muted">{r.sub}</span>
                </Link>
              </li>
            ))}
            {!results.length && <p className="note ink">{t.noResults}</p>}
          </ul>
        ) : (
          <div className="shelves">
            {visible.map((shelf, i) => {
              const entries = entriesFor(shelf.id)
              if (!entries.length)
                return (
                  <section
                    key={shelf.id}
                    className="sk dash shelf shelf-empty"
                    aria-label={t.shelves[shelf.id]}
                  >
                    <div className="hdr">
                      <h2 className="h-m pencil">{t.shelves[shelf.id]}</h2>
                      <span className="note ink">{t.soon}</span>
                    </div>
                  </section>
                )
              return (
                <ShelfPaper key={shelf.id} i={i}>
                  <h2 className="h-m">{t.shelves[shelf.id]}</h2>
                  <ul className="stack" style={{ gap: 6, marginTop: 6 }}>
                    {entries.map((e) => (
                      <li key={e.key}>
                        <Link to={e.to} className="shelf-entry">
                          <span className="h-s shelf-title">
                            {e.title}
                            <Icon name="next" size="s" />
                          </span>
                          {e.preview}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </ShelfPaper>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
