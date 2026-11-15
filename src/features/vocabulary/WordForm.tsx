import { useState, type FormEvent, type ReactNode } from 'react'
import { Button, LineArea, LineField } from '../../components/Controls'
import { pl } from '../../i18n/pl'
import type { WordInput } from '../../lib/db/words'
import { parseTags } from '../../lib/vocab'

export function WordForm({
  initial,
  submitLabel,
  onSubmit,
  blocked,
}: {
  initial: WordInput
  submitLabel: string
  onSubmit: (input: WordInput) => void
  // np. komunikat o duplikacie; wtedy nie da się zapisać
  blocked?: ReactNode
}) {
  const t = pl.words.form
  const [term, setTerm] = useState(initial.term)
  const [translation, setTranslation] = useState(initial.translation)
  const [example, setExample] = useState(initial.example ?? '')
  const [tags, setTags] = useState(initial.tags.join(', '))
  const en = initial.direction === 'en-pl'

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!term.trim() || !translation.trim() || blocked) return
    onSubmit({
      term,
      translation,
      direction: initial.direction,
      example,
      tags: parseTags(tags),
    })
  }

  return (
    <form className="stack word-form" onSubmit={submit}>
      <LineField
        label={en ? t.english : t.polish}
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        lang={en ? 'en' : 'pl'}
        required
      />
      <LineField
        label={en ? t.polish : t.english}
        value={translation}
        onChange={(e) => setTranslation(e.target.value)}
        lang={en ? 'pl' : 'en'}
        required
      />
      <LineArea
        label={t.example}
        value={example}
        rows={2}
        placeholder={t.examplePlaceholder}
        onChange={(e) => setExample(e.target.value)}
        lang="en"
        style={{ minHeight: 60 }}
      />
      <LineField
        label={t.tags}
        value={tags}
        placeholder={t.tagsPlaceholder}
        onChange={(e) => setTags(e.target.value)}
        autoCapitalize="off"
      />
      {blocked}
      <Button type="submit" variant="mint" block disabled={!!blocked}>
        {submitLabel}
      </Button>
    </form>
  )
}
