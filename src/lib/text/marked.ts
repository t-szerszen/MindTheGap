import type { FormulaPart, Role } from '../../content/schema'

// notacja z makiety: "[k:If] + [v:Present Simple]" → kawałki z rolami, reszta to zwykły tekst
const letters: Record<string, Role> = {
  s: 'subject',
  a: 'aux',
  v: 'verb',
  k: 'signal',
  n: 'particle',
}

const TOKEN = /\[([a-z]):([^[\]]+)\]/g

export function parseMarked(text: string): FormulaPart[] {
  const out: FormulaPart[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    const i = m.index ?? 0
    if (i > last) out.push({ text: text.slice(last, i), role: 'neutral' })
    out.push({ text: m[2]!, role: letters[m[1]!] ?? 'neutral' })
    last = i + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), role: 'neutral' })
  return out
}

// dla walidatora treści: nieznana litera albo niedomknięty nawias to błąd w pliku
export function markedError(text: string): string | undefined {
  for (const m of text.matchAll(TOKEN)) {
    if (!letters[m[1]!]) return `nieznana rola [${m[1]}:…]`
    if (m[2] !== m[2]!.trim()) return `spacja na brzegu w [${m[1]}:${m[2]}]`
  }
  if (/[[\]]/.test(text.replace(TOKEN, ''))) return `niedomknięty albo pusty nawias w „${text}”`
  return undefined
}
