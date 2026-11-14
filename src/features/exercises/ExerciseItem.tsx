import type { Exercise } from '../../content/schema'
import { GapFillItem, type ItemProps } from './GapFillItem'

// tu dochodzą kolejne typy: multiple-choice, transformation
export function ExerciseItem({ ex, ...props }: ItemProps & { ex: Exercise }) {
  switch (ex.type) {
    case 'gap-fill':
      return <GapFillItem ex={ex} {...props} />
  }
}
