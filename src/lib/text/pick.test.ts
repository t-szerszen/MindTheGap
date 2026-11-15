import { describe, expect, it } from 'vitest'
import { extractSentence, isEnglishLang, normalizeSelection, placePopover } from './pick'

function sentenceAround(text: string, part: string) {
  const start = text.indexOf(part)
  return extractSentence(text, start, start + part.length)
}

describe('normalizeSelection', () => {
  it('obcina spacje i interpunkcję z brzegów', () => {
    expect(normalizeSelection('  “break the ice,”  ')).toBe('break the ice')
    expect(normalizeSelection('look\n  forward to')).toBe('look forward to')
  })

  it('zostawia apostrof w środku słowa', () => {
    expect(normalizeSelection('don’t')).toBe("don't")
  })

  it('odrzuca puste, same znaki i za długie zaznaczenia', () => {
    expect(normalizeSelection('   ')).toBeNull()
    expect(normalizeSelection(' ... ')).toBeNull()
    expect(normalizeSelection('123')).toBeNull()
    expect(normalizeSelection('one two three four five six seven')).toBeNull()
    expect(normalizeSelection('a'.repeat(61))).toBeNull()
  })

  it('przepuszcza 6 słów i 60 znaków', () => {
    expect(normalizeSelection('one two three four five six')).toBe('one two three four five six')
    expect(normalizeSelection('a'.repeat(60))).toBe('a'.repeat(60))
  })
})

describe('isEnglishLang', () => {
  it('rozpoznaje en i en-GB, ale nie pl', () => {
    expect(isEnglishLang('en')).toBe(true)
    expect(isEnglishLang('en-GB')).toBe(true)
    expect(isEnglishLang('pl')).toBe(false)
    expect(isEnglishLang(null)).toBe(false)
  })
})

describe('extractSentence', () => {
  const text = 'I was tired. She had already left when I arrived! Then we went home.'

  it('wyciąga zdanie, w którym jest zaznaczenie', () => {
    expect(sentenceAround(text, 'already left')).toBe('She had already left when I arrived!')
    expect(sentenceAround(text, 'tired')).toBe('I was tired.')
    expect(sentenceAround(text, 'went home')).toBe('Then we went home.')
  })

  it('nie tnie na skrótach i liczbach z kropką', () => {
    const t = 'Mr. Smith paid 2.50 pounds for it. Nobody cared.'
    expect(sentenceAround(t, 'paid')).toBe('Mr. Smith paid 2.50 pounds for it.')
  })

  it('zostawia cudzysłów zamykający i kończy na nowej linii', () => {
    expect(sentenceAround('He said, "I give up." Then he left.', 'give up')).toBe(
      'He said, "I give up."',
    )
    expect(sentenceAround('First line\nsecond line here', 'second')).toBe('second line here')
  })

  it('za długie zdanie skraca wokół zaznaczenia', () => {
    const long = `${'word '.repeat(80)}take part in ${'word '.repeat(80)}end.`
    const out = sentenceAround(long, 'take part in')
    expect(out.length).toBeLessThanOrEqual(245)
    expect(out).toContain('take part in')
    expect(out.startsWith('…')).toBe(true)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('placePopover', () => {
  const view = { width: 390, height: 800 }
  const pop = { width: 300, height: 200 }

  it('stawia dymek pod zaznaczeniem, wyśrodkowany', () => {
    const p = placePopover({ top: 100, bottom: 120, left: 150, right: 240 }, pop, view)
    expect(p).toEqual({ top: 130, left: 45, side: 'below' })
  })

  it('nie wychodzi poza boki ekranu', () => {
    expect(placePopover({ top: 100, bottom: 120, left: 0, right: 20 }, pop, view).left).toBe(8)
    expect(placePopover({ top: 100, bottom: 120, left: 370, right: 388 }, pop, view).left).toBe(82)
  })

  it('przy dole ekranu idzie nad zaznaczenie', () => {
    const p = placePopover({ top: 700, bottom: 720, left: 100, right: 200 }, pop, view)
    expect(p).toEqual({ top: 490, left: 8, side: 'above' })
  })

  it('jak nigdzie się nie mieści, bierze stronę z większym miejscem i ucina wysokość', () => {
    const below = placePopover(
      { top: 100, bottom: 400, left: 100, right: 200 },
      { width: 300, height: 500 },
      view,
    )
    expect(below).toMatchObject({ top: 410, side: 'below', maxHeight: 382 })
    const above = placePopover(
      { top: 500, bottom: 700, left: 100, right: 200 },
      { width: 300, height: 600 },
      view,
    )
    expect(above).toMatchObject({ top: 8, side: 'above', maxHeight: 482 })
  })
})
