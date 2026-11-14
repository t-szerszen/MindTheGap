import { useEffect, useState, type ReactNode } from 'react'
import { watchWords } from '../../lib/db/words'
import { useAuth } from '../auth/useAuth'
import { WordsContext, type WordsState } from './useWords'

const empty: WordsState = {
  words: [],
  loading: false,
  fromCache: false,
  pending: false,
  error: false,
}

// jedna subskrypcja na całą aplikację: start, tłumacz i fiszki widzą te same dane na żywo
export function WordsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<WordsState & { uid?: string }>(empty)

  useEffect(() => {
    if (!user) return
    return watchWords(
      user.uid,
      (words, meta) => setState({ words, loading: false, error: false, uid: user.uid, ...meta }),
      () => setState((s) => ({ ...s, loading: false, error: true, uid: user.uid })),
    )
  }, [user])

  // po wylogowaniu albo przed pierwszym snapshotem nie pokazujemy cudzych/starych danych
  const value: WordsState = !user
    ? empty
    : state.uid === user.uid
      ? state
      : { ...empty, loading: true }
  return <WordsContext.Provider value={value}>{children}</WordsContext.Provider>
}
