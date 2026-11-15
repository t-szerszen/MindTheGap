import type { Exercise } from '../../content/schema'
import { ChoiceItem } from './ChoiceItem'
import { GapFillItem } from './GapFillItem'
import type { ItemProps } from './ItemParts'
import { KeyWordItem } from './KeyWordItem'
import { WordFormationItem } from './WordFormationItem'

// nowy typ zadania = nowy case tutaj i w lib/exercises/check
export function ExerciseItem({ ex, ...props }: ItemProps & { ex: Exercise }) {
  switch (ex.type) {
    case 'gap-fill':
      return <GapFillItem ex={ex} {...props} />
    case 'choice':
      return <ChoiceItem ex={ex} {...props} />
    case 'word-formation':
      return <WordFormationItem ex={ex} {...props} />
    case 'key-word-transformation':
      return <KeyWordItem ex={ex} {...props} />
  }
}
