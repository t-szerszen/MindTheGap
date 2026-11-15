import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { Loading, NoteState } from '../../components/States'
import { pl } from '../../i18n/pl'
import { accuracy, leeches } from '../../lib/srs'
import { englishSide, polishSide } from '../../lib/vocab'
import { useWords } from './useWords'

export function LeechesPage() {
  const { words, loading } = useWords()
  const t = pl.leeches
  if (loading) return <Loading />
  const list = leeches(words)
  return (
    <div className="measure stack">
      <Link className="link-pen" to="/words" style={{ alignSelf: 'flex-start', marginLeft: -4 }}>
        <Icon name="back" size="s" />
        {t.back}
      </Link>
      <h1 className="h-l">{t.title}</h1>
      <Scribble width={180} />
      <p className="note" style={{ marginTop: 4 }}>
        {t.hint}
      </p>

      {list.length === 0 ? (
        <div style={{ marginTop: 24 }}>
          <NoteState title={pl.review.noLeeches} color="m" />
        </div>
      ) : (
        <>
          <Link
            className="btn btn-pink"
            to="/review?mode=leeches"
            style={{ marginTop: 16, alignSelf: 'flex-start' }}
          >
            <Icon name="flip" />
            {t.practice}
          </Link>
          <ol className="word-list">
            {list.map((w) => (
              <li key={w.id} className="word-row">
                <div className="grow">
                  <p className="h-s" lang="en">
                    {englishSide(w)}
                  </p>
                  <p className="small muted">{polishSide(w)}</p>
                  <p className="note">
                    {pl.words.accuracy(Math.round((accuracy(w) ?? 0) * 100))} · {t.lapses(w.lapses)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
