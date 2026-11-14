import { useSyncExternalStore } from 'react'

export type ThemeChoice = 'light' | 'dark' | 'system'

export type Prefs = { theme: ThemeChoice; calm: boolean }

// te same klucze czyta skrypt w index.html, zanim cokolwiek się narysuje
const THEME_KEY = 'mtg-theme'
const CALM_KEY = 'mtg-calm'
const PAPER = { light: '#F7F0E1', dark: '#1F2427' }

function load(): Prefs {
  try {
    const t = localStorage.getItem(THEME_KEY)
    return {
      theme: t === 'light' || t === 'dark' ? t : 'system',
      calm: localStorage.getItem(CALM_KEY) === '1',
    }
  } catch {
    return { theme: 'system', calm: false }
  }
}

let current = load()
const listeners = new Set<() => void>()

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

export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...current, ...patch }
  if (next.theme === current.theme && next.calm === current.calm) return
  current = next
  try {
    if (next.theme === 'system') localStorage.removeItem(THEME_KEY)
    else localStorage.setItem(THEME_KEY, next.theme)
    localStorage.setItem(CALM_KEY, next.calm ? '1' : '0')
  } catch {
    // tryb prywatny w Safari potrafi rzucić wyjątkiem, wtedy po prostu nie zapamiętujemy
  }
  apply(next)
  listeners.forEach((l) => l())
}

export function getPrefs() {
  return current
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function usePrefs() {
  return useSyncExternalStore(subscribe, getPrefs)
}

export function systemIsDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

apply(current)
