// zakreśla słowa-sygnały w przykładach na podstawie listy z pliku czasu

export type Segment = { text: string; signal: boolean }

function escape(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// "today / this week" -> ["today", "this week"], "never… before" -> ["never", "before"]
export function signalPhrases(words: string[]) {
  const out = new Set<string>()
  for (const w of words) {
    for (const part of w.split(/\/|…/)) {
      const p = part.replace(/[?!]/g, '').trim()
      // dwuliterowe (as, by) łapałyby za dużo przypadkowych miejsc
      if (p.length >= 3) out.add(p.toLowerCase())
    }
  }
  // dłuższe najpierw, żeby "this week" wygrało z "this"
  return [...out].sort((a, b) => b.length - a.length)
}

export function markSignals(text: string, phrases: string[]): Segment[] {
  if (!phrases.length) return [{ text, signal: false }]
  const re = new RegExp(`(?<![\\w'])(${phrases.map(escape).join('|')})(?![\\w'])`, 'gi')
  const out: Segment[] = []
  let last = 0
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0
    if (i > last) out.push({ text: text.slice(last, i), signal: false })
    out.push({ text: m[0], signal: true })
    last = i + m[0].length
  }
  if (last < text.length) out.push({ text: text.slice(last), signal: false })
  return out
}
