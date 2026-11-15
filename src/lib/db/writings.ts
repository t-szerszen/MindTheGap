import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { getDb } from './firebase'

// szkic wypracowania: jeden dokument na temat, users/{uid}/writings/{taskId}
export type Draft = {
  plan: string
  text: string
  seconds: number
  submitted: boolean
  checks: string[]
  // czas ostatniej zmiany z urządzenia (ms), żeby wiedzieć, która wersja jest nowsza
  updatedAt: number
}

export const emptyDraft: Draft = {
  plan: '',
  text: '',
  seconds: 0,
  submitted: false,
  checks: [],
  updatedAt: 0,
}

function parse(x: Record<string, unknown>): Draft {
  return {
    plan: typeof x.plan === 'string' ? x.plan : '',
    text: typeof x.text === 'string' ? x.text : '',
    seconds: typeof x.seconds === 'number' ? x.seconds : 0,
    submitted: x.submitted === true,
    checks: Array.isArray(x.checks) ? x.checks.filter((c) => typeof c === 'string') : [],
    updatedAt: typeof x.updatedAt === 'number' ? x.updatedAt : 0,
  }
}

export function watchDraft(uid: string, taskId: string, cb: (d: Draft | null) => void) {
  const db = getDb()
  if (!db) return () => {}
  return onSnapshot(
    doc(db, 'users', uid, 'writings', taskId),
    (snap) => cb(snap.exists() ? parse(snap.data()) : null),
    () => cb(null),
  )
}

export function saveDraft(uid: string, taskId: string, d: Draft) {
  const db = getDb()
  if (!db) return
  // offline zapis czeka w kolejce Firestore, więc nikt tego nie awaituje
  setDoc(doc(db, 'users', uid, 'writings', taskId), d).catch(() => {})
}

export function parseDraft(raw: string | null): Draft | null {
  if (!raw) return null
  try {
    return parse(JSON.parse(raw) as Record<string, unknown>)
  } catch {
    return null
  }
}
