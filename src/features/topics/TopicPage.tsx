import { Link, useParams } from 'react-router'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { NotFound } from '../../components/States'
import { pl } from '../../i18n/pl'
import { useExercises, useGrammarTabs, useTopics } from '../../lib/content'
import { BlockView } from './BlockView'
import { topicHome } from './hub'

export function TopicPage() {
  const { id = '' } = useParams()
  const topic = useTopics().find((t) => t.id === id)
  const exercises = useExercises()
  const tabs = useGrammarTabs()
  if (!topic) return <NotFound />
  const t = pl.topics
  const practice = exercises.filter((e) => e.tags.includes(topic.id)).length
  const home = topicHome(topic.category)
  // „cała teoria” z trybów warunkowych wraca na ich przekładkę, nie na „Wish”
  const tab = tabs.find((x) => x.id === topic.id) ?? tabs.find((x) => x.topic === topic.id)
  const back =
    home === 'grammar'
      ? { to: tab ? `/grammar/${tab.id}` : '/grammar', label: pl.nav.grammar }
      : home === 'tenses'
        ? { to: '/tenses', label: pl.nav.tenses }
        : { to: '/more', label: pl.nav.more }

  return (
    <article className="sheet ruled page-in">
      <div className="measure stack">
        <Link className="link-pen" to={back.to} style={{ alignSelf: 'flex-start', marginLeft: -4 }}>
          <Icon name="back" size="s" />
          {back.label}
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
