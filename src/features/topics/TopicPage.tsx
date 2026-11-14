import { Link, useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { NotFound } from '../../components/States'
import { pl } from '../../i18n/pl'
import { getExercises, getTopic } from '../../lib/content'
import { BlockView } from './BlockView'

export function TopicPage() {
  const { id = '' } = useParams()
  const topic = getTopic(id)
  if (!topic) return <NotFound />
  const t = pl.topics
  const practice = getExercises().filter((e) => e.tags.includes(topic.id)).length

  return (
    <article className="sheet ruled page-in">
      <div className="measure stack">
        <Link className="link-pen" to="/more" style={{ alignSelf: 'flex-start', marginLeft: -4 }}>
          <Icon name="back" size="s" />
          {pl.nav.more}
        </Link>
        <p className="eyebrow">{t.categories[topic.category]}</p>
        <h1 className="h-l">{topic.title_pl}</h1>
        <Scribble width={200} />
        <p className="note blue" style={{ marginTop: 4 }}>
          {topic.summary_pl}
        </p>
        <div className="blocks">
          {topic.blocks.map((b, i) => (
            <BlockView key={i} block={b} />
          ))}
        </div>
        {practice > 0 && (
          <Link
            className="btn btn-primary btn-block"
            to={`/exercises/session?tags=${topic.id}`}
            style={{ marginTop: 26 }}
          >
            <Icon name="pencil" />
            {t.practice}
          </Link>
        )}
      </div>
    </article>
  )
}
