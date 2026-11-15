// terminy z harmonogramu CKE z 20.08.2026 (matura 2027, język angielski)
export const EXAM_IDS = ['basic', 'extended', 'oral'] as const
export type ExamId = (typeof EXAM_IDS)[number]

export const WRITTEN_EXAMS: Record<'basic' | 'extended', { date: string; time: string }> = {
  basic: { date: '2027-05-06', time: '09:00' },
  extended: { date: '2027-05-07', time: '09:00' },
}

// ustną ustala szkoła, gdzieś w tym przedziale
export const ORAL_RANGE = { from: '2027-05-06', to: '2027-05-31' }

export const DEFAULT_EXAMS: ExamId[] = ['extended']
