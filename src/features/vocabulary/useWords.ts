import { createContext, useContext } from 'react'
import type { Word } from '../../lib/db/words'

export type WordsState = {
  words: Word[]
  loading: boolean
  // dane z pamięci telefonu, bez potwierdzenia z serwera
  fromCache: boolean
  pending: boolean
  error: boolean
}

export const WordsContext = createContext<WordsState>({
  words: [],
  loading: false,
  fromCache: false,
  pending: false,
  error: false,
})

export function useWords() {
  return useContext(WordsContext)
}
