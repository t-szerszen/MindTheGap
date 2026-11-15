import { setPrefs, systemIsDark, usePrefs } from '../features/settings/prefs'
import { pl } from '../i18n/pl'
import { Icon } from './Icon'

// słońce i księżyc obok siebie, zakreślony ten, który jest teraz włączony
export function ThemePill({ vertical }: { vertical?: boolean }) {
  const { theme } = usePrefs()
  const dark = theme === 'dark' || (theme === 'system' && systemIsDark())

  return (
    <button
      type="button"
      className={vertical ? 'theme-pill vert' : 'theme-pill'}
      aria-label={dark ? pl.theme.toLight : pl.theme.toDark}
      onClick={() => setPrefs({ theme: dark ? 'light' : 'dark' })}
    >
      <span className={dark ? undefined : 'on'}>
        <Icon name="sun" />
      </span>
      <span className={dark ? 'on' : undefined}>
        <Icon name="moon" />
      </span>
    </button>
  )
}
