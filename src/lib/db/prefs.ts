import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FirestoreDataConverter,
} from 'firebase/firestore'
import { getDb } from './firebase'

export type RemotePrefs = { theme: 'light' | 'dark' | 'system'; calm: boolean }

const converter: FirestoreDataConverter<RemotePrefs> = {
  toFirestore: (p) => ({ theme: p.theme, calm: p.calm, updatedAt: serverTimestamp() }),
  fromFirestore: (snap) => {
    const d = snap.data()
    const theme = d.theme === 'light' || d.theme === 'dark' ? d.theme : 'system'
    return { theme, calm: d.calm === true }
  },
}

function prefsRef(uid: string) {
  return doc(getDb()!, 'users', uid, 'meta', 'prefs').withConverter(converter)
}

export function watchPrefs(uid: string, cb: (p: RemotePrefs | null) => void) {
  if (!getDb()) return () => {}
  return onSnapshot(
    prefsRef(uid),
    (snap) => cb(snap.exists() ? snap.data() : null),
    () => cb(null),
  )
}

export function savePrefs(uid: string, p: RemotePrefs) {
  if (!getDb()) return
  // offline promise czeka na serwer, więc nikt tego nie awaituje
  setDoc(prefsRef(uid), p).catch(() => {})
}
