import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
} from 'firebase/firestore'
import { markActivity } from './activity'
import { getDb } from './firebase'

export type Attempt = {
  id: string
  exerciseId: string
  tags: string[]
  correct: boolean
  answer: string
  at: Date
}

// TODO: przy tysiącach prób lepiej trzymać zagregowane statystyki w jednym dokumencie
const MAX_LOADED = 2000

export function watchAttempts(uid: string, cb: (a: Attempt[]) => void, onError?: () => void) {
  const db = getDb()
  if (!db) {
    cb([])
    return () => {}
  }
  const q = query(
    collection(db, 'users', uid, 'exerciseAttempts'),
    orderBy('at', 'desc'),
    limit(MAX_LOADED),
  )
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const x = d.data()
          return {
            id: d.id,
            exerciseId: String(x.exerciseId ?? ''),
            tags: Array.isArray(x.tags) ? x.tags : [],
            correct: x.correct === true,
            answer: String(x.answer ?? ''),
            at: x.at instanceof Timestamp ? x.at.toDate() : new Date(0),
          }
        }),
      ),
    onError,
  )
}

export function addAttempt(
  uid: string,
  a: { exerciseId: string; tags: string[]; correct: boolean; answer: string },
  now = new Date(),
) {
  const db = getDb()
  if (!db) return
  const ref = doc(collection(db, 'users', uid, 'exerciseAttempts'))
  setDoc(ref, { ...a, answer: a.answer.slice(0, 200), at: Timestamp.fromDate(now) }).catch(() => {})
  markActivity(uid, now)
}
