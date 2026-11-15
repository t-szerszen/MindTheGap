import { useSyncExternalStore } from 'react'
import type { ExamId } from '../../lib/exams/constants'
import { parseExams } from '../../lib/exams/countdown'

export type ThemeChoice = 'light' | 'dark' | 'system'

export type Prefs = { theme: ThemeChoice; calm: boolean; exams: ExamId[]; oralAt: string | null }

// te same klucze czyta skrypt w index.html, zanim cokolwiek się narysuje
const THEME_KEY = 'mtg-theme'
const CALM_KEY = 'mtg-calm'
const EXAMS_KEY = 'mtg-exams'
const ORAL_KEY = 'mtg-oral'
const PAPER = { light: '#F7F0E1', dark: '#1F2427' }

function load(): Prefs {
  try {
    const t = localStorage.getItem(THEME_KEY)
    const exams = localStorage.getItem(EXAMS_KEY)
    return {
      theme: t === 'light' || t === 'dark' ? t : 'system',
      calm: localStorage.getItem(CALM_KEY) === '1',
      exams: parseExams(exams === null ? undefined : exams.split(',')),
      oralAt: localStorage.getItem(ORAL_KEY),
    }
  } catch {
    return { theme: 'system', calm: false, exams: parseExams(undefined), oralAt: null }
  }
}

let current = load()
const listeners = new Set<() => void>()
const userListeners = new Set<(p: Prefs) => void>()

function apply(p: Prefs) {
  const root = document.documentElement
  if (p.theme === 'system') delete root.dataset.theme
  else root.dataset.theme = p.theme
  if (p.calm) root.dataset.motion = 'calm'
  else delete root.dataset.motion

  // pasek statusu w PWA ma mieć kolor kartki, także przy ręcznie wybranym motywie
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    const isDarkMeta = m.media.includes('dark')
    const color = p.theme === 'system' ? (isDarkMeta ? PAPER.dark : PAPER.light) : PAPER[p.theme]
    m.content = color
  })
}

// source = 'remote', kiedy zmiana przyszła z Firestore (wtedy nie odsyłamy jej z powrotem)
export function setPrefs(patch: Partial<Prefs>, source: 'user' | 'remote' = 'user') {
  const next = { ...current, ...patch }
  if (
    next.theme === current.theme &&
    next.calm === current.calm &&
    next.exams.join() === current.exams.join() &&
    next.oralAt === current.oralAt
  )
    return
  current = next
  try {
    if (next.theme === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, next.theme)
    localStorage.setItem(CALM_KEY, next.calm ? '1' : '0')
    localStorage.setItem(EXAMS_KEY, next.exams.join(','))
    if (next.oralAt) localStorage.setItem(ORAL_KEY, next.oralAt)
    else localStorage.removeItem(ORAL_KEY)
  } catch {
    // tryb prywatny w Safari potrafi rzucić wyjątkiem, wtedy po prostu nie zapamiętujemy
  }
  apply(next)
  listeners.forEach((l) => l())
  if (source === 'user') userListeners.forEach((l) => l(next))
}

export function onUserPrefsChange(l: (p: Prefs) => void) {
  userListeners.add(l)
  return () => {
    userListeners.delete(l)
  }
}

export function getPrefs() {
  return current
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function usePrefs() {
  return useSyncExternalStore(subscribe, getPrefs)
}

export function systemIsDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

apply(current)
