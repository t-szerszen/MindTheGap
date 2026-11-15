// rozpoczęta seria na tym urządzeniu (wygoda, nie dane do synchronizacji)
const KEY = 'mtg-exercise-session'

export type SavedSession = {
  query: string
  ids: string[]
  values: Record<string, string>
  checked: Record<string, boolean>
}

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as SavedSession
    return Array.isArray(s.ids) ? s : null
  } catch {
    return null
  }
}

export function saveSession(s: SavedSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // brak miejsca albo tryb prywatny: seria po prostu nie przetrwa odświeżenia
  }
}

export function sessionProgress(s: SavedSession) {
  return { done: s.ids.filter((id) => s.checked[id]).length, total: s.ids.length }
}
