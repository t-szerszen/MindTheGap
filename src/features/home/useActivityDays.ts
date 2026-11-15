import { useEffect, useState } from 'react'
import { watchActivity } from '../../lib/db/activity'
import { useAuth } from '../auth/useAuth'

export function useActivityDays() {
  const { user } = useAuth()
  const [state, setState] = useState<{ uid?: string; days: string[] }>({ days: [] })
  useEffect(() => {
    if (!user) return
    return watchActivity(user.uid, (days) => setState({ uid: user.uid, days }))
  }, [user])
  return user && state.uid === user.uid ? state.days : []
}
