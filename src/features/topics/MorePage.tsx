import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Card } from '../../components/Paper'
import { pl } from '../../i18n/pl'

export function MorePage() {
  return (
    <div className="sheet dotted plain page-in">
      <div className="measure stack">
        <header className="stack" style={{ gap: 2 }}>
          <p className="eyebrow">{pl.nav.more}</p>
          <h1 className="h-l">{pl.more.title}</h1>
          <p className="note blue">{pl.more.subtitle}</p>
        </header>

        <Card
          as={Link}
          to="/settings"
          tilt={1}
          className="row"
          style={{ marginTop: 28, textDecoration: 'none', gap: 12 }}
        >
          <Icon name="gear" size="l" />
          <span className="grow">
            <span className="h-s" style={{ display: 'block' }}>
              {pl.settings.title}
            </span>
            <span className="small muted">{pl.more.settingsHint}</span>
          </span>
          <Icon name="next" size="s" />
        </Card>
      </div>
    </div>
  )
}
