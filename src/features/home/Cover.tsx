import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Hl } from '../../components/Ink'
import { ThemePill } from '../../components/ThemePill'
import { pl } from '../../i18n/pl'

// okładka zeszytu z naklejką, jak w projekcie
export function Cover({ name }: { name?: string }) {
  return (
    <header className="cover home-cover">
      <span className="home-band" aria-hidden="true" />
      <div className="stack home-controls">
        <ThemePill vertical />
        <Link className="ibtn" to="/settings" aria-label={pl.nav.settings}>
          <Icon name="gear" />
        </Link>
      </div>
      <div className="home-label r-1">
        <div className="home-label-in">
          <p className="eyebrow" style={{ letterSpacing: '.32em' }}>
            {pl.home.notebook}
          </p>
          <p className="h-xl" style={{ fontSize: 46 }} lang="en">
            Mind the{' '}
            <Hl draw delay={350}>
              Gap
            </Hl>
          </p>
          <p className="note ink" style={{ fontSize: 14 }}>
            {pl.home.subject}
          </p>
          <p className="row" style={{ gap: 8, width: '100%', marginTop: 4 }}>
            <span className="note ink" style={{ fontSize: 14 }}>
              {pl.home.nameLabel}
            </span>
            <span className="pen home-name">{name ?? ''}</span>
          </p>
        </div>
      </div>
    </header>
  )
}
