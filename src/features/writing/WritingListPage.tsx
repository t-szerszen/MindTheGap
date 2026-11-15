import { useState } from 'react'
import { Link } from 'react-router'
import { TagButton } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Card } from '../../components/Paper'
import { NoteState } from '../../components/States'
import type { WritingForm } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { countWords } from '../../lib/answers/words'
import { useWritingTasks } from '../../lib/content'
import { localDraft } from './useDraft'

const forms: WritingForm[] = ['essay', 'article', 'formal-letter']

export function WritingListPage() {
  const t = pl.writing
  const tasks = useWritingTasks()
  const [form, setForm] = useState<WritingForm | null>(null)
  const shown = tasks.filter((w) => !form || w.form === form)

  return (
    <div className="sheet ruled page-in">
      <div className="measure stack">
        <header className="stack" style={{ gap: 2 }}>
          <Link className="link-pen back" to="/exercises">
            <Icon name="back" size="s" />
            {pl.exercises.eyebrow}
          </Link>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="h-l">{t.title}</h1>
          <p className="note blue">{t.subtitle}</p>
        </header>

        <div className="row wrap chips" style={{ marginTop: 14 }}>
          <TagButton pressed={!form} color="y" onClick={() => setForm(null)}>
            {pl.exercises.all}
          </TagButton>
          {forms.map((f) => (
            <TagButton key={f} pressed={form === f} color="b" onClick={() => setForm(f)}>
              {t.forms[f]}
            </TagButton>
          ))}
        </div>

        {!shown.length && <NoteState title={t.empty} color="b" />}

        <ul className="stack writing-list">
          {shown.map((w, i) => {
            const d = localDraft(w.id)
            return (
              <li key={w.id}>
                <Card
                  as={Link}
                  to={`/writing/${w.id}`}
                  tilt={i % 2 ? 1 : -1}
                  className="writing-card"
                >
                  <span className="row wrap" style={{ gap: 6 }}>
                    <span className="tag tg-b">{t.forms[w.form]}</span>
                    <span className="tag">{pl.themes[w.theme]}</span>
                    {w.models.length > 0 && <span className="tag tg-m">{t.withModel}</span>}
                  </span>
                  <span className="body-l writing-prompt">{w.prompt_pl}</span>
                  {d && (d.text || d.submitted) && (
                    <span className="note ink">
                      {d.submitted ? t.submitted : t.draft(countWords(d.text))}
                    </span>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
