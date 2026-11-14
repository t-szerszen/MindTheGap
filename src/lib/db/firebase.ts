import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  browserLocalPersistence,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

const env = import.meta.env

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

// bez konfiguracji aplikacja dalej działa, tylko bez konta i synchronizacji
export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId)

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined

function getApp() {
  app ??= initializeApp(config)
  return app
}

export function getAuthInstance() {
  if (!firebaseConfigured) return undefined
  // initializeAuth zamiast getAuth: bez popupRedirectResolver, bo w PWA na iOS popupy i tak nie działają
  auth ??= initializeAuth(getApp(), {
    persistence: [indexedDBLocalPersistence, browserLocalPersistence],
  })
  return auth
}

export function getDb() {
  if (!firebaseConfigured) return undefined
  db ??= initializeFirestore(getApp(), {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  })
  return db
}
