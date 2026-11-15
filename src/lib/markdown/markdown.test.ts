import { describe, expect, it } from 'vitest'
import { parseInline, parseMarkdown } from './index'

describe('parseInline', () => {
  it('pogrubienie, kursywa i zakreślacz', () => {
    expect(parseInline('**must go**, nie *must to go* i ==ważne==')).toEqual([
      { kind: 'bold', text: 'must go' },
      { kind: 'text', text: ', nie ' },
      { kind: 'italic', text: 'must to go' },
      { kind: 'text', text: ' i ' },
      { kind: 'mark', text: 'ważne' },
    ])
  })

  it('samotna gwiazdka zostaje tekstem', () => {
    expect(parseInline('2 * 3')).toEqual([{ kind: 'text', text: '2 * 3' }])
  })

  it('znaczniki HTML to zwykły tekst', () => {
    expect(parseInline('<b>x</b>')).toEqual([{ kind: 'text', text: '<b>x</b>' }])
  })
})

describe('parseMarkdown', () => {
  it('akapity rozdzielone pustą linią, linie w akapicie sklejone', () => {
    const b = parseMarkdown('Pierwszy\nciąg dalszy.\n\nDrugi.')
    expect(b).toHaveLength(2)
    expect(b[0]).toEqual({ kind: 'p', inline: [{ kind: 'text', text: 'Pierwszy ciąg dalszy.' }] })
  })

  it('lista z myślników', () => {
    const b = parseMarkdown('- **can** — umiem\n- *must* — muszę')
    expect(b[0]?.kind).toBe('ul')
    if (b[0]?.kind === 'ul') expect(b[0].items).toHaveLength(2)
  })
})
