import { useState } from 'react'
import { Switch } from '../../components/Controls'
import { pl } from '../../i18n/pl'
import {
  disableReminder,
  enableReminder,
  loadReminder,
  PushError,
  pushConfig,
  pushSupported,
  setReminderHour,
  type PushErrorKind,
  type Reminder,
} from '../../lib/push'

const HOURS = Array.from({ length: 24 }, (_, h) => h)

export function ReminderSection() {
  const t = pl.settings
  const [r, setR] = useState<Reminder>(loadReminder)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<PushErrorKind | null>(null)
  const configured = !!pushConfig()
  const supported = configured && pushSupported()

  async function run(job: () => Promise<Reminder> | Reminder) {
    setBusy(true)
    setError(null)
    try {
      setR(await job())
    } catch (e) {
      setError(e instanceof PushError ? e.kind : 'failed')
    } finally {
      setBusy(false)
    }
  }

  const message =
    error === 'denied'
      ? t.reminderDenied
      : error === 'unsupported'
        ? t.reminderUnsupported
        : error
          ? t.reminderFailed
          : null

  return (
    <section style={{ marginTop: 28 }} aria-labelledby="reminder-h">
      <h2 id="reminder-h" className="h-m">
        {t.reminder}
      </h2>
      {!configured ? (
        <p className="note ink" style={{ fontSize: 14 }}>
          {t.reminderOff}
        </p>
      ) : !supported ? (
        <p className="note ink" style={{ fontSize: 14 }}>
          {t.reminderUnsupported}
        </p>
      ) : (
        <>
          <p className="note ink" style={{ fontSize: 14, marginBottom: 10 }}>
            {t.reminderHint} {t.reminderNeeds}
          </p>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <span id="reminder-l" className="body-l" style={{ fontSize: 19 }}>
              {busy ? t.reminderSaving : t.reminderToggle}
            </span>
            <Switch
              checked={r.on}
              labelledBy="reminder-l"
              onChange={(on) =>
                !busy && run(() => (on ? enableReminder(r.hour) : disableReminder(r)))
              }
            />
          </div>
          <div style={{ marginTop: 10 }}>
            <label className="field-label" htmlFor="reminder-hour">
              {t.reminderHour}
            </label>
            <select
              id="reminder-hour"
              className="line-input"
              value={r.hour}
              disabled={busy}
              onChange={(e) => run(() => setReminderHour(r, Number(e.target.value)))}
            >
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {`${String(h).padStart(2, '0')}:00`}
                </option>
              ))}
            </select>
          </div>
          {message && (
            <p className="note red" role="alert" style={{ fontSize: 14, marginTop: 6 }}>
              {message}
            </p>
          )}
        </>
      )}
    </section>
  )
}
