import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FirestoreDataConverter,
} from 'firebase/firestore'
import type { ExamId } from '../exams/constants'
import { parseExams } from '../exams/countdown'
import { getDb } from './firebase'

export type RemotePrefs = {
  theme: 'light' | 'dark' | 'system'
  calm: boolean
  exams: ExamId[]
  oralAt: string | null
}

// starsze dokumenty nie mają matur, wtedy zostaje to, co jest lokalnie
type Incoming = Omit<RemotePrefs, 'exams' | 'oralAt'> & Partial<RemotePrefs>

const converter: FirestoreDataConverter<RemotePrefs, Record<string, unknown>> = {
  toFirestore: (p) => ({
    theme: p.theme,
    calm: p.calm,
    exams: p.exams,
    oralAt: p.oralAt,
    updatedAt: serverTimestamp(),
  }),
  fromFirestore: (snap) => {
    const d = snap.data()
    const theme = d.theme === 'light' || d.theme === 'dark' ? d.theme : 'system'
    const p: Incoming = { theme, calm: d.calm === true }
    if ('exams' in d) p.exams = parseExams(d.exams)
    if ('oralAt' in d) p.oralAt = typeof d.oralAt === 'string' ? d.oralAt : null
    return p as RemotePrefs
  },
}

function prefsRef(uid: string) {
  return doc(getDb()!, 'users', uid, 'meta', 'prefs').withConverter(converter)
}

export function watchPrefs(uid: string, cb: (p: Incoming | null) => void) {
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
