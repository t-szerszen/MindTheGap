import { useEffect, useState, type ReactNode } from 'react'
import { watchAttempts, type Attempt } from '../../lib/db/attempts'
import { useAuth } from '../auth/useAuth'
import { AttemptsContext } from './useAttempts'

export function AttemptsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [state, setState] = useState<{ uid?: string; attempts: Attempt[] }>({ attempts: [] })

  useEffect(() => {
    if (!user) return
    return watchAttempts(
      user.uid,
      (attempts) => setState({ uid: user.uid, attempts }),
      () => setState({ uid: user.uid, attempts: [] }),
    )
  }, [user])

  const value = !user
    ? { attempts: [], loading: false }
    : state.uid === user.uid
      ? { attempts: state.attempts, loading: false }
      : { attempts: [], loading: true }
  return <AttemptsContext.Provider value={value}>{children}</AttemptsContext.Provider>
}
