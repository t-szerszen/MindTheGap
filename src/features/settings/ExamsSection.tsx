import { pl } from '../../i18n/pl'
import { EXAM_IDS, ORAL_RANGE, WRITTEN_EXAMS, type ExamId } from '../../lib/exams/constants'
import { examDayLabel, parseOral } from '../../lib/exams/countdown'
import { setPrefs, usePrefs } from './prefs'

export function ExamsSection() {
  const { exams, oralAt } = usePrefs()
  const t = pl.settings
  const oralBad = !!oralAt && !parseOral(oralAt)

  function toggle(id: ExamId) {
    const next = exams.includes(id) ? exams.filter((e) => e !== id) : [...exams, id]
    setPrefs({ exams: EXAM_IDS.filter((e) => next.includes(e)) })
  }

  return (
    <section style={{ marginTop: 28 }} aria-labelledby="exams-h">
      <h2 id="exams-h" className="h-m">
        {t.exams}
      </h2>
      <p className="note ink" style={{ fontSize: 14, marginBottom: 6 }}>
        {t.examsHint}
      </p>
      {EXAM_IDS.map((id) => (
        <label key={id} className="exam-pick">
          <input type="checkbox" checked={exams.includes(id)} onChange={() => toggle(id)} />
          <span className="stack">
            <span className="body-l" style={{ fontSize: 19 }}>
              {pl.matura.full[id]}
            </span>
            <span className="note ink" style={{ fontSize: 13 }}>
              {id === 'oral'
                ? t.oralWhen
                : `${t.written} · ${examDayLabel(WRITTEN_EXAMS[id].date, WRITTEN_EXAMS[id].time)}`}
            </span>
          </span>
        </label>
      ))}
      {exams.includes('oral') && (
        <div className="exam-oral">
          <label className="field-label" htmlFor="oral-at">
            {t.oralDate}
          </label>
          <input
            id="oral-at"
            className="line-input"
            type="datetime-local"
            min={`${ORAL_RANGE.from}T00:00`}
            max={`${ORAL_RANGE.to}T23:59`}
            value={oralAt ?? ''}
            aria-invalid={oralBad || undefined}
            aria-describedby={oralBad ? 'oral-bad' : undefined}
            onChange={(e) => setPrefs({ oralAt: e.target.value || null })}
          />
          {oralBad && (
            <p id="oral-bad" className="note red" style={{ fontSize: 14, marginTop: 4 }}>
              {t.oralBad}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
