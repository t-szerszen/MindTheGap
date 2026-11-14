import { useEffect } from 'react'
import { savePrefs, watchPrefs } from '../../lib/db/prefs'
import { useAuth } from '../auth/useAuth'
import { getPrefs, onUserPrefsChange, setPrefs } from './prefs'

// motyw: localStorage od razu, a po zalogowaniu dodatkowo Firestore, żeby telefon i komputer się zgadzały
export function PrefsSync() {
  const { user } = useAuth()
  useEffect(() => {
    if (!user) return
    let first = true
    const stopRemote = watchPrefs(user.uid, (remote) => {
      if (remote) setPrefs(remote, 'remote')
      else if (first) savePrefs(user.uid, getPrefs())
      first = false
    })
    const stopLocal = onUserPrefsChange((p) => savePrefs(user.uid, p))
    return () => {
      stopRemote()
      stopLocal()
    }
  }, [user])
  return null
}
