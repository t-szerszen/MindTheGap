import type { PhraseSet, Topic } from '../../content/schema'

// półki w „Więcej”: każda zbiera tematy i zestawy zwrotów z kilku kategorii treści
export type Shelf = {
  id: string
  topics: Topic['category'][]
  sets: PhraseSet['category'][]
}

// gramatyka i czasy mają swoje przekładki, tu zostaje słownictwo, pisanie i matura
export const shelves: Shelf[] = [
  { id: 'idioms', topics: [], sets: ['idioms'] },
  { id: 'phrasal', topics: ['phrasal-verbs'], sets: ['phrasal-verbs'] },
  { id: 'linkers', topics: [], sets: ['linkers'] },
  {
    id: 'writing',
    topics: ['writing'],
    sets: ['essay-phrases', 'article-phrases', 'letter-phrases'],
  },
  { id: 'vocabulary', topics: ['vocabulary'], sets: ['collocations', 'word-families', 'register'] },
  { id: 'words', topics: [], sets: ['false-friends', 'confused-words'] },
  { id: 'exam', topics: ['exam'], sets: [] },
  { id: 'other', topics: ['other'], sets: [] },
]

// gdzie „mieszka” temat: od tego zależy podświetlona przekładka i link wstecz
export function topicHome(category: Topic['category']): 'grammar' | 'tenses' | 'more' {
  if (category === 'grammar' || category === 'modals' || category === 'prepositions')
    return 'grammar'
  if (category === 'tenses') return 'tenses'
  return 'more'
}
