import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { newCard, type CardState } from '../srs'
import type { Direction } from '../translate'
import { markActivity } from './activity'
import { getDb } from './firebase'

export type Word = CardState & {
  id: string
  term: string
  translation: string
  direction: Direction
  example?: string
  tags: string[]
  createdAt: Date
}

export type WordInput = {
  term: string
  translation: string
  direction: Direction
  example?: string
  tags: string[]
}

const toDate = (v: unknown) => (v instanceof Timestamp ? v.toDate() : new Date(0))
const num = (v: unknown, fallback = 0) => (typeof v === 'number' ? v : fallback)

const converter: FirestoreDataConverter<Word> = {
  // zapisy idą przez zwykłe obiekty niżej, ten kierunek jest tylko dla porządku
  toFirestore: (w) => {
    const data: Partial<Word> = { ...(w as Word) }
    delete data.id
    return data as DocumentData
  },
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const d = snap.data({ serverTimestamps: 'estimate' })
    return {
      id: snap.id,
      term: String(d.term ?? ''),
      translation: String(d.translation ?? ''),
      direction: d.direction === 'en-pl' ? 'en-pl' : 'pl-en',
      example: typeof d.example === 'string' && d.example ? d.example : undefined,
      tags: Array.isArray(d.tags) ? d.tags.filter((t: unknown) => typeof t === 'string') : [],
      createdAt: toDate(d.createdAt),
      box: num(d.box, 1),
      dueAt: toDate(d.dueAt),
      attempts: num(d.attempts),
      correct: num(d.correct),
      lapses: num(d.lapses),
      streak: num(d.streak),
      lastReviewedAt: d.lastReviewedAt instanceof Timestamp ? d.lastReviewedAt.toDate() : null,
    }
  },
}

function wordsCol(uid: string) {
  return collection(getDb()!, 'users', uid, 'words').withConverter(converter)
}

function wordDoc(uid: string, id: string) {
  return doc(getDb()!, 'users', uid, 'words', id)
}

// bez skonfigurowanego Firebase zapisy są po prostu pomijane, zamiast wywalać ekran
function withDb<T>(fn: () => Promise<T>) {
  return getDb() ? fn().catch(() => {}) : Promise.resolve()
}

function stateFields(s: CardState) {
  return {
    box: s.box,
    dueAt: Timestamp.fromDate(s.dueAt),
    attempts: s.attempts,
    correct: s.correct,
    lapses: s.lapses,
    streak: s.streak,
    lastReviewedAt: s.lastReviewedAt ? Timestamp.fromDate(s.lastReviewedAt) : null,
  }
}

export function watchWords(
  uid: string,
  cb: (words: Word[], meta: { fromCache: boolean; pending: boolean }) => void,
  onError?: (e: Error) => void,
) {
  if (!getDb()) {
    cb([], { fromCache: false, pending: false })
    return () => {}
  }
  return onSnapshot(
    query(wordsCol(uid), orderBy('createdAt', 'desc')),
    { includeMetadataChanges: true },
    (snap) =>
      cb(
        snap.docs.map((d) => d.data()),
        { fromCache: snap.metadata.fromCache, pending: snap.metadata.hasPendingWrites },
      ),
    onError,
  )
}

// zapis offline: promise kończy się dopiero po odpowiedzi serwera, więc nie czekamy na nią w UI
export function addWord(uid: string, input: WordInput, now = new Date()) {
  const db = getDb()
  if (!db) return undefined
  const ref = doc(collection(db, 'users', uid, 'words'))
  const data = {
    term: input.term.trim(),
    translation: input.translation.trim(),
    direction: input.direction,
    tags: input.tags,
    createdAt: Timestamp.fromDate(now),
    ...(input.example?.trim() ? { example: input.example.trim() } : {}),
    ...stateFields(newCard(now)),
  }
  setDoc(ref, data).catch(() => {})
  markActivity(uid, now)
  return ref.id
}

export function updateWord(uid: string, id: string, input: WordInput) {
  return withDb(() =>
    updateDoc(wordDoc(uid, id), {
      term: input.term.trim(),
      translation: input.translation.trim(),
      direction: input.direction,
      tags: input.tags,
      example: input.example?.trim() ? input.example.trim() : deleteField(),
    }),
  )
}

export function saveReview(uid: string, id: string, state: CardState) {
  markActivity(uid)
  return withDb(() => updateDoc(wordDoc(uid, id), stateFields(state)))
}

export function deleteWord(uid: string, id: string) {
  return withDb(() => deleteDoc(wordDoc(uid, id)))
}
