import { Link } from 'react-router'
import { Sheet } from '../../components/Sheet'
import { pl } from '../../i18n/pl'
import { addWord, type WordInput } from '../../lib/db/words'
import { englishSide, findDuplicate } from '../../lib/vocab'
import { useAuth } from '../auth/useAuth'
import { useWords } from './useWords'
import { WordForm } from './WordForm'

// ten sam formularz zapisu dla tłumacza i dla zwrotów z tematów
export function SaveWordSheet({
  draft,
  onClose,
  onSaved,
}: {
  draft: WordInput | null
  onClose: () => void
  onSaved?: () => void
}) {
  const { user } = useAuth()
  const { words } = useWords()
  const t = pl.words
  const dupe = draft ? findDuplicate(words, draft) : undefined

  return (
    <Sheet open={!!draft} onClose={onClose} title={t.saveTitle}>
      {draft && user && (
        <WordForm
          key={englishSide(draft)}
          initial={draft}
          submitLabel={t.saveBtn}
          blocked={
            dupe && (
              <p className="note" role="alert">
                {t.duplicate}{' '}
                <Link className="link-pen" to={`/words?q=${encodeURIComponent(englishSide(dupe))}`}>
                  {t.showIt}
                </Link>
              </p>
            )
          }
          onSubmit={(input) => {
            addWord(user.uid, input)
            onSaved?.()
            onClose()
          }}
        />
      )}
    </Sheet>
  )
}
