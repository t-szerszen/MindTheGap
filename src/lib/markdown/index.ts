// bardzo mały markdown do tekstów w tematach: akapity, listy "- ", **pogrubienie**, *kursywa*, ==zakreślacz==
// celowo bez HTML, żeby treść nigdy nie trafiała do innerHTML

export type Inline = { kind: 'text' | 'bold' | 'italic' | 'mark'; text: string }
export type MdBlock = { kind: 'p'; inline: Inline[] } | { kind: 'ul'; items: Inline[][] }

const INLINE = /(\*\*[^*]+\*\*|==[^=]+==|\*[^*\s][^*]*\*)/g

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  let last = 0
  for (const m of src.matchAll(INLINE)) {
    const i = m.index ?? 0
    if (i > last) out.push({ kind: 'text', text: src.slice(last, i) })
    const raw = m[0]
    if (raw.startsWith('**')) out.push({ kind: 'bold', text: raw.slice(2, -2) })
    else if (raw.startsWith('==')) out.push({ kind: 'mark', text: raw.slice(2, -2) })
    else out.push({ kind: 'italic', text: raw.slice(1, -1) })
    last = i + raw.length
  }
  if (last < src.length) out.push({ kind: 'text', text: src.slice(last) })
  return out
}

export function parseMarkdown(src: string): MdBlock[] {
  const blocks: MdBlock[] = []
  for (const chunk of src.split(/\n\s*\n/)) {
    const lines = chunk
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    if (!lines.length) continue
    if (lines.every((l) => l.startsWith('- '))) {
      blocks.push({ kind: 'ul', items: lines.map((l) => parseInline(l.slice(2))) })
    } else {
      blocks.push({ kind: 'p', inline: parseInline(lines.join(' ')) })
    }
  }
  return blocks
}
