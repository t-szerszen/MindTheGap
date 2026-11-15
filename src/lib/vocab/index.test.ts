import { describe, expect, it } from 'vitest'
import {
  buildOwnCard,
  englishSide,
  findDuplicate,
  normalizeText,
  parseTags,
  polishSide,
  wordsToCsv,
} from './index'

const saved = [
  { term: 'na dłuższą metę', translation: 'in the long run', direction: 'pl-en' as const },
  { term: 'make up your mind', translation: 'zdecydować się', direction: 'en-pl' as const },
]

describe('strony słówka', () => {
  it('angielska i polska strona zależą od kierunku', () => {
    expect(englishSide(saved[0]!)).toBe('in the long run')
    expect(polishSide(saved[0]!)).toBe('na dłuższą metę')
    expect(englishSide(saved[1]!)).toBe('make up your mind')
    expect(polishSide(saved[1]!)).toBe('zdecydować się')
  })
})

describe('normalizeText', () => {
  it('ignoruje wielkość liter, spacje, apostrofy i kropkę na końcu', () => {
    expect(normalizeText('  I Can’t   wait. ')).toBe("i can't wait")
  })
})

describe('findDuplicate', () => {
  it('ten sam angielski zwrot z drugiego kierunku to duplikat', () => {
    const d = findDuplicate(saved, {
      term: 'In the long run.',
      translation: 'w dłuższej perspektywie',
      direction: 'en-pl',
    })
    expect(d).toBe(saved[0])
  })

  it('inny angielski zwrot przy tym samym polskim to nie duplikat', () => {
    expect(
      findDuplicate(saved, { term: 'zdecydować się', translation: 'decide', direction: 'pl-en' }),
    ).toBeUndefined()
  })
})

describe('parseTags', () => {
  it('przecinki, małe litery, bez powtórek i pustych', () => {
    expect(parseTags('Idiom, rozprawka,, idiom ,e-mail')).toEqual(['idiom', 'rozprawka', 'e-mail'])
  })
})

describe('wordsToCsv', () => {
  it('nagłówek i cudzysłowy tam, gdzie trzeba', () => {
    const csv = wordsToCsv([
      {
        term: 'despite',
        translation: 'pomimo',
        direction: 'en-pl',
        example: 'Despite the rain, we went "out".',
        tags: ['spójniki', 'kontrast'],
        attempts: 3,
        correct: 2,
      },
    ])
    expect(csv.split('\n')).toEqual([
      'english,polish,example,tags,attempts,correct',
      'despite,pomimo,"Despite the rain, we went ""out"".","spójniki, kontrast",3,2',
    ])
  })
})

describe('buildOwnCard', () => {
  it('bez angielskiego albo polskiego nie ma fiszki', () => {
    expect(buildOwnCard({ en: '  ', pl: 'przełamać lody', example: '', tag: 'idiom' })).toBeNull()
    expect(buildOwnCard({ en: 'break the ice', pl: '', example: '', tag: 'idiom' })).toBeNull()
  })

  it('przycina spacje, etykieta małymi literami, pusty przykład znika', () => {
    expect(
      buildOwnCard({ en: ' break  the ice ', pl: 'przełamać lody ', example: ' ', tag: ' Idiom' }),
    ).toEqual({
      term: 'break the ice',
      translation: 'przełamać lody',
      direction: 'en-pl',
      tags: ['idiom'],
      source: 'own',
    })
  })

  it('zostawia przykład i pozwala na brak etykiety', () => {
    const card = buildOwnCard({
      en: 'break the ice',
      pl: 'przełamać lody',
      example: 'A joke can break the ice.',
      tag: '',
    })
    expect(card?.example).toBe('A joke can break the ice.')
    expect(card?.tags).toEqual([])
  })
})
