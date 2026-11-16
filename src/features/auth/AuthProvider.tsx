import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { watchUser, type AppUser } from '../../lib/db/auth'
import { firebaseConfigured } from '../../lib/db/firebase'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(
    () =>
      watchUser((u) => {
        setUser(u)
        setReady(true)
      }),
    [],
  )

  const value = useMemo(() => ({ user, ready, configured: firebaseConfigured }), [user, ready])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
