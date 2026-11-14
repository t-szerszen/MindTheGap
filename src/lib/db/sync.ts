import { waitForPendingWrites } from 'firebase/firestore'
import { getDb } from './firebase'

// czeka, aż wszystko, co zapisałem offline, dojdzie do serwera
export async function flushWrites() {
  const db = getDb()
  if (db) await waitForPendingWrites(db)
}
