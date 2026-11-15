import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { pl } from '../../i18n/pl'
import { deleteWord, type Word } from '../../lib/db/words'
import { englishSide, polishSide } from '../../lib/vocab'
import { WordStats } from './WordStats'

export function WordRow({
  word,
  uid,
  now,
  fresh,
  onEdit,
}: {
  word: Word
  uid: string
  now: Date
  fresh?: boolean
  onEdit: (w: Word) => void
}) {
  const [confirm, setConfirm] = useState(false)
  const t = pl.words
  return (
    <li className="word-row">
      <div className="grow">
        <p className="h-s" lang="en">
          {englishSide(word)}
          {fresh && <span className="note word-fresh">{t.justAdded}</span>}
        </p>
        <p className="small muted">{polishSide(word)}</p>
        {word.example && (
          <p className="ex-pl" lang="en">
            {word.example}
          </p>
        )}
        <WordStats word={word} now={now} />
        {word.source && <p className="note ink word-source">{t.sources[word.source]}</p>}
        {word.tags.length > 0 && (
          <div className="row wrap" style={{ gap: 6, marginTop: 4 }}>
            {word.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        {confirm && (
          <div className="row wrap confirm" role="alert">
            <span className="note">{t.confirmDelete}</span>
            <button type="button" className="link-pen red" onClick={() => deleteWord(uid, word.id)}>
              {t.confirmYes}
            </button>
            <button type="button" className="link-pen" onClick={() => setConfirm(false)}>
              {t.confirmNo}
            </button>
          </div>
        )}
      </div>
      <div className="stack word-actions">
        <button
          type="button"
          className="ibtn"
          aria-label={`${t.edit}: ${englishSide(word)}`}
          onClick={() => onEdit(word)}
        >
          <Icon name="pencil" size="s" />
        </button>
        <button
          type="button"
          className="ibtn"
          aria-label={`${t.delete}: ${englishSide(word)}`}
          onClick={() => setConfirm(true)}
        >
          <Icon name="trash" size="s" />
        </button>
      </div>
    </li>
  )
}
