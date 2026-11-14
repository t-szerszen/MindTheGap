import { Link } from 'react-router'
import { Switch } from '../../components/Controls'
import { Icon } from '../../components/Icon'
import { Scribble } from '../../components/Ink'
import { pl } from '../../i18n/pl'
import { setPrefs, systemIsDark, usePrefs } from './prefs'
import { ThemePicker } from './ThemePicker'

export function SettingsPage() {
  const { calm } = usePrefs()
  const t = pl.settings
  return (
    <div className="sheet lined plain page-in">
      <div className="measure stack">
        <Link className="link-pen" to="/more" style={{ alignSelf: 'flex-start', marginLeft: -4 }}>
          <Icon name="back" size="s" />
          {pl.nav.more}
        </Link>
        <h1 className="h-l">{t.title}</h1>
        <Scribble width={150} />

        <section style={{ marginTop: 18 }} aria-labelledby="look-h">
          <h2 id="look-h" className="h-m" style={{ marginBottom: 14 }}>
            {t.look}
          </h2>
          <ThemePicker />
          <p className="note ink" style={{ fontSize: 14, marginTop: 12 }}>
            {t.themeHint(systemIsDark() ? t.systemDark : t.systemLight)}
          </p>
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
            <div className="stack">
              <span id="calm-l" className="body-l" style={{ fontSize: 19 }}>
                {t.calm}
              </span>
              <span className="note ink" style={{ fontSize: 13 }}>
                {t.calmHint}
              </span>
            </div>
            <Switch checked={calm} onChange={(v) => setPrefs({ calm: v })} labelledBy="calm-l" />
          </div>
        </section>

        <p className="note ink" style={{ fontSize: 13, marginTop: 28 }}>
          {t.version}
        </p>
      </div>
    </div>
  )
}
