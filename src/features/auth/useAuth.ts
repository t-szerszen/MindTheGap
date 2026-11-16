import { createContext, useContext } from 'react'
import type { AppUser } from '../../lib/db/auth'

type AuthState = {
  user: AppUser | null
  ready: boolean
  configured: boolean
}

export const AuthContext = createContext<AuthState>({
  user: null,
  ready: false,
  configured: false,
})

export function useAuth() {
  return useContext(AuthContext)
}
