import { arrayUnion, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { dayKey } from '../streak'
import { getDb } from './firebase'

function ref(uid: string) {
  return doc(getDb()!, 'users', uid, 'meta', 'activity')
}

// arrayUnion jest idempotentne, więc można wołać przy każdej odpowiedzi
export function markActivity(uid: string, now = new Date()) {
  if (!getDb()) return
  setDoc(ref(uid), { days: arrayUnion(dayKey(now)) }, { merge: true }).catch(() => {})
}

export function watchActivity(uid: string, cb: (days: string[]) => void) {
  if (!getDb()) {
    cb([])
    return () => {}
  }
  return onSnapshot(
    ref(uid),
    (snap) => {
      const days = snap.data()?.days
      cb(Array.isArray(days) ? days.filter((d): d is string => typeof d === 'string') : [])
    },
    () => cb([]),
  )
}
