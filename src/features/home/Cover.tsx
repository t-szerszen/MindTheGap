import type { CSSProperties } from 'react'
import { Link } from 'react-router'
import { Icon } from '../../components/Icon'
import { Logo } from '../../components/Logo'
import { ThemePill } from '../../components/ThemePill'
import { pl } from '../../i18n/pl'

// okładka zeszytu z naklejką, jak w projekcie
export function Cover() {
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
        <Logo
          stack
          tagline={pl.home.tagline}
          className="home-label-in"
          style={{ '--lm': '60px', '--lw': '44px' } as CSSProperties}
        />
      </div>
    </header>
  )
}
