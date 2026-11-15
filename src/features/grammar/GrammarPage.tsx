import { Suspense, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { MarkedText } from '../../components/Formula'
import { HowToChoose } from '../../components/HowToChoose'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { NotFound } from '../../components/States'
import type { GrammarTab, GrammarTopic, Topic } from '../../content/schema'
import { pl } from '../../i18n/pl'
import { useExercises, useGrammarTabs, useGrammarTopics, useTopics } from '../../lib/content'
import { BlockView } from '../topics/BlockView'
import { GrammarSubnav } from './GrammarSubnav'
import { GrammarTabs } from './GrammarTabs'
import { SubtypeView } from './SubtypeView'

export function GrammarPage() {
  const { id } = useParams()
  const tabs = useGrammarTabs()
  const views = useGrammarTopics()
  const topics = useTopics()
  if (!id) return <Navigate to={`/grammar/${tabs[0]!.id}`} replace />
  const tab = tabs.find((t) => t.id === id)
  if (!tab) return <NotFound />

  const view = views.find((v) => v.id === tab.id)
  const topic = tab.topic ? topics.find((t) => t.id === tab.topic) : undefined
  const soon = (t: GrammarTab) => !t.topic && !views.some((v) => v.id === t.id)
  const head = {
    eyebrow: pl.grammar.eyebrow(pl.grammar.groups[tab.group], tabs.indexOf(tab) + 1, tabs.length),
    title: view?.title_pl ?? topic?.title_pl ?? tab.label_pl,
    note: view?.note_pl ?? topic?.summary_pl,
  }

  return (
    <div className="tense-wrap">
      <article className="sheet ruled page-in tense-sheet">
        <GrammarSubnav current="grammar" />
        <header className="gr-head">
          <div className="stack" style={{ gap: 2 }}>
            <p className="eyebrow">{head.eyebrow}</p>
            <h1 className="h-xl tense-title">{head.title}</h1>
            <Scribble width={210} />
          </div>
          {head.note && <p className="note gr-note">{head.note}</p>}
        </header>
        {view ? (
          <ReadyView key={view.id} view={view} group={tab.group} />
        ) : topic ? (
          <LinkedTopic topic={topic} label={tab.label_pl} />
        ) : (
          <Soon />
        )}
      </article>
      <GrammarTabs tabs={tabs} current={tab.id} soon={soon} />
    </div>
  )
}

function ReadyView({ view, group }: { view: GrammarTopic; group: GrammarTab['group'] }) {
  const [subId, setSubId] = useState(view.defaultSubtype)
  const sub = view.subtypes.find((s) => s.id === subId) ?? view.subtypes[0]!
  const g = pl.grammar
  return (
    <SubtypeView view={view} sub={sub} group={group} onPick={setSubId}>
      <HowToChoose
        key={sub.id}
        title={view.chooseTitle_pl}
        hint={g.stepsHint}
        steps={sub.steps.map((text, i) => ({
          key: g.stepKeys[i]!,
          text: <MarkedText text={text} />,
        }))}
      />
      <div className="gr-end stack">
        <Link
          className="btn btn-mint btn-block gr-practice"
          to={`/exercises/session?tags=${view.practiceTag}`}
        >
          <Icon name="pencil" />
          {g.practice(view.title_pl)}
        </Link>
        <Link
          className="link-pen"
          to={`/topics/${view.theoryTopic}`}
          style={{ alignSelf: 'flex-start' }}
        >
          {g.theory}
          <Icon name="next" size="s" />
        </Link>
      </div>
    </SubtypeView>
  )
}

function LinkedTopic({ topic, label }: { topic: Topic; label: string }) {
  return (
    <>
      <div className="blocks">
        {topic.blocks.map((b, i) => (
          <BlockView key={i} block={b} />
        ))}
      </div>
      <Suspense fallback={null}>
        <Practice tag={topic.id} label={label} />
      </Suspense>
    </>
  )
}

// zadania ładują się osobno, żeby teoria nie czekała na cały bank
function Practice({ tag, label }: { tag: string; label: string }) {
  const n = useExercises().filter((e) => e.tags.includes(tag)).length
  if (!n) return null
  return (
    <Link
      className="btn btn-mint btn-block"
      to={`/exercises/session?tags=${tag}`}
      style={{ marginTop: 26 }}
    >
      <Icon name="pencil" />
      {pl.grammar.practice(label)}
    </Link>
  )
}

function Soon() {
  const g = pl.grammar
  return (
    <div className="sk dash gr-soon">
      <p className="h-s">{g.soonTitle}</p>
      <p className="small muted">{g.soonText}</p>
      <Link className="link-pen" to="/grammar/conditionals" style={{ alignSelf: 'flex-start' }}>
        {g.soonLink}
        <Icon name="next" size="s" />
      </Link>
    </div>
  )
}
