import { createContext, useContext } from 'react'
import type { Attempt } from '../../lib/db/attempts'

export const AttemptsContext = createContext<{ attempts: Attempt[]; loading: boolean }>({
  attempts: [],
  loading: false,
})

export function useAttempts() {
  return useContext(AttemptsContext)
}
