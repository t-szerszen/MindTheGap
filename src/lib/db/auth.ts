import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { FirebaseError } from 'firebase/app'
import { getAuthInstance } from './firebase'

export type AppUser = { uid: string; email: string; name: string }

function need() {
  const auth = getAuthInstance()
  if (!auth) throw new Error('firebase-not-configured')
  return auth
}

export function watchUser(cb: (user: AppUser | null) => void) {
  const auth = getAuthInstance()
  if (!auth) {
    cb(null)
    return () => {}
  }
  return onAuthStateChanged(auth, (u) =>
    cb(u ? { uid: u.uid, email: u.email ?? '', name: u.displayName ?? '' } : null),
  )
}

export async function signIn(email: string, password: string) {
  await signInWithEmailAndPassword(need(), email.trim(), password)
}

export async function resetPassword(email: string) {
  await sendPasswordResetEmail(need(), email.trim())
}

export async function logOut() {
  await signOut(need())
}

export function authErrorCode(e: unknown) {
  if (e instanceof FirebaseError) return e.code
  return 'unknown'
}
