import type { PhraseSet, Topic } from '../../content/schema'

// półki w „Więcej”: każda zbiera tematy i zestawy zwrotów z kilku kategorii treści
export type Shelf = {
  id: string
  topics: Topic['category'][]
  sets: PhraseSet['category'][]
}

export const shelves: Shelf[] = [
  { id: 'exam', topics: ['exam'], sets: [] },
  {
    id: 'writing',
    topics: ['writing'],
    sets: ['essay-phrases', 'article-phrases', 'letter-phrases'],
  },
  { id: 'tenses', topics: ['tenses'], sets: [] },
  { id: 'grammar', topics: ['grammar'], sets: [] },
  { id: 'modals', topics: ['modals'], sets: [] },
  { id: 'vocabulary', topics: ['vocabulary'], sets: ['collocations', 'word-families', 'register'] },
  { id: 'idioms', topics: [], sets: ['idioms'] },
  { id: 'phrasal', topics: ['phrasal-verbs'], sets: ['phrasal-verbs'] },
  { id: 'linkers', topics: [], sets: ['linkers'] },
  { id: 'words', topics: [], sets: ['false-friends', 'confused-words'] },
  { id: 'prepositions', topics: ['prepositions'], sets: [] },
  { id: 'other', topics: ['other'], sets: [] },
]
