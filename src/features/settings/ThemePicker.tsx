import { Icon, type IconName } from '../../components/Icon'
import { pl } from '../../i18n/pl'
import { setPrefs, usePrefs, type ThemeChoice } from './prefs'

const options: { id: ThemeChoice; label: string; icon: IconName; paper: string; tilt: string }[] = [
  { id: 'light', label: pl.theme.light, icon: 'sun', paper: 'lt', tilt: 'r-1' },
  { id: 'dark', label: pl.theme.dark, icon: 'moon', paper: 'dk', tilt: 'r1' },
  { id: 'system', label: pl.theme.system, icon: 'auto', paper: 'sys', tilt: 'r0' },
]

export function ThemePicker() {
  const { theme } = usePrefs()
  return (
    <div className="seg" role="group" aria-label={pl.theme.label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`seg-opt ${o.tilt}`}
          aria-pressed={theme === o.id}
          onClick={() => setPrefs({ theme: o.id })}
        >
          <span className={`mini-paper ${o.paper}`} />
          <span className="row" style={{ gap: 4 }}>
            <Icon name={o.icon} size="s" />
            {o.label}
          </span>
        </button>
      ))}
    </div>
  )
}
