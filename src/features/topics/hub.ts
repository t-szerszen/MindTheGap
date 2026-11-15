import type { PhraseSet, Topic } from '../../content/schema'

// półki w „Więcej”: każda zbiera tematy i zestawy zwrotów z kilku kategorii treści
export type Shelf = {
  id: string
  topics: Topic['category'][]
  sets: PhraseSet['category'][]
}

export const shelves: Shelf[] = [
  { id: 'grammar', topics: ['grammar'], sets: [] },
  { id: 'modals', topics: ['modals'], sets: [] },
  { id: 'idioms', topics: [], sets: ['idioms'] },
  { id: 'linkers', topics: [], sets: ['linkers'] },
  { id: 'prepositions', topics: ['prepositions'], sets: [] },
  { id: 'essay', topics: ['essay'], sets: ['essay-phrases'] },
  { id: 'phrasal', topics: ['phrasal-verbs'], sets: [] },
  { id: 'other', topics: ['other'], sets: ['collocations'] },
]
