import { useEffect, useRef, useState } from 'react'
import { emptyDraft, parseDraft, saveDraft, watchDraft, type Draft } from '../../lib/db/writings'
import { useAuth } from '../auth/useAuth'

const key = (taskId: string) => `mtg-writing-${taskId}`
const SAVE_MS = 1500

export function localDraft(taskId: string): Draft | null {
  try {
    return parseDraft(localStorage.getItem(key(taskId)))
  } catch {
    return null
  }
}

// szkic żyje w localStorage od razu (działa bez konta i offline), a po zalogowaniu
// leci też do Firestore; z chmury bierzemy tylko wersję nowszą niż ta na urządzeniu
export function useDraft(taskId: string) {
  const { user } = useAuth()
  const [draft, setDraft] = useState<Draft>(() => localDraft(taskId) ?? emptyDraft)
  const latest = useRef(draft)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!user) return
    return watchDraft(user.uid, taskId, (remote) => {
      if (remote && remote.updatedAt > latest.current.updatedAt) {
        latest.current = remote
        setDraft(remote)
      }
    })
  }, [user, taskId])

  useEffect(() => () => clearTimeout(timer.current), [])

  function update(patch: Partial<Draft>) {
    const next = { ...latest.current, ...patch, updatedAt: Date.now() }
    latest.current = next
    setDraft(next)
    try {
      localStorage.setItem(key(taskId), JSON.stringify(next))
    } catch {
      // brak miejsca: zostaje to, co w pamięci i w chmurze
    }
    if (!user || timer.current) return
    // co najwyżej jeden zapis na 1,5 s, także gdy stoper zmienia szkic co sekundę
    timer.current = setTimeout(() => {
      timer.current = undefined
      saveDraft(user.uid, taskId, latest.current)
    }, SAVE_MS)
  }

  return [draft, update] as const
}
