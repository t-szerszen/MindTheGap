import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { markActivity } from './activity'
import { getDb } from './firebase'

// wynik arkusza próbnego: users/{uid}/mocks
export type MockResult = {
  id: string
  setId: string
  score: number
  max: number
  seconds: number
  at: Date
}

export function watchMockResults(uid: string, cb: (r: MockResult[]) => void) {
  const db = getDb()
  if (!db) {
    cb([])
    return () => {}
  }
  const q = query(collection(db, 'users', uid, 'mocks'), orderBy('at', 'desc'), limit(20))
  return onSnapshot(
    q,
    (snap) =>
      cb(
        snap.docs.map((d) => {
          const x = d.data()
          return {
            id: d.id,
            setId: String(x.setId ?? ''),
            score: Number(x.score ?? 0),
            max: Number(x.max ?? 0),
            seconds: Number(x.seconds ?? 0),
            at: x.at instanceof Timestamp ? x.at.toDate() : new Date(),
          }
        }),
      ),
    () => cb([]),
  )
}

export function addMockResult(uid: string, r: Omit<MockResult, 'id' | 'at'>) {
  const db = getDb()
  if (!db) return
  addDoc(collection(db, 'users', uid, 'mocks'), { ...r, at: serverTimestamp() }).catch(() => {})
  markActivity(uid)
}
