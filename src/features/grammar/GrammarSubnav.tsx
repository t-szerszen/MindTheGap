import { Link } from 'react-router'
import { pl } from '../../i18n/pl'

// tylko na telefonie: tam czasy i zagadnienia dzielą jedną przekładkę na dole
export function GrammarSubnav({ current }: { current: 'tenses' | 'grammar' }) {
  const t = pl.grammar.subnav
  return (
    <nav className="subnav sk gr-subnav" aria-label={t.label}>
      <Link to="/tenses" aria-current={current === 'tenses' ? 'page' : undefined}>
        {t.tenses}
      </Link>
      <Link to="/grammar" aria-current={current === 'grammar' ? 'page' : undefined}>
        {t.grammar}
      </Link>
    </nav>
  )
}
