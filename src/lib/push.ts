// przypomnienie push: subskrypcja w przeglądarce + worker, który wysyła o wybranej godzinie
// stan trzymam tylko w localStorage, bo subskrypcja jest przypisana do jednego urządzenia

import { dayKey } from './streak'

export type Reminder = { on: boolean; hour: number; endpoint: string | null }
export type PushErrorKind = 'unsupported' | 'denied' | 'failed'

export class PushError extends Error {
  kind: PushErrorKind
  constructor(kind: PushErrorKind) {
    super(kind)
    this.kind = kind
  }
}

export const DEFAULT_HOUR = 18
const KEY = 'mtg-reminder'
const PING_KEY = 'mtg-reminder-ping'

// worker od tłumacza obsługuje też push, więc osobny adres jest opcjonalny
export function pushConfig(env: Partial<Record<string, string>> = import.meta.env) {
  const url = (env.VITE_PUSH_API_URL || env.VITE_TRANSLATE_API_URL)?.replace(/\/+$/, '')
  const key = env.VITE_VAPID_PUBLIC_KEY?.trim()
  return url && key ? { url, key } : null
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function vapidKeyBytes(key: string) {
  const b64 = key.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export function parseReminder(raw: string | null): Reminder {
  try {
    const r = JSON.parse(raw ?? '') as Partial<Reminder>
    const hour = Number.isInteger(r.hour) && r.hour! >= 0 && r.hour! <= 23 ? r.hour! : DEFAULT_HOUR
    const endpoint = typeof r.endpoint === 'string' ? r.endpoint : null
    return { on: r.on === true && !!endpoint, hour, endpoint }
  } catch {
    return { on: false, hour: DEFAULT_HOUR, endpoint: null }
  }
}

export function loadReminder(): Reminder {
  try {
    return parseReminder(localStorage.getItem(KEY))
  } catch {
    return parseReminder(null)
  }
}

function saveReminder(r: Reminder) {
  try {
    localStorage.setItem(KEY, JSON.stringify(r))
  } catch {
    // tryb prywatny, trudno
  }
}

async function post(path: string, body: unknown) {
  const cfg = pushConfig()
  if (!cfg) throw new PushError('unsupported')
  const res = await fetch(`${cfg.url}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new PushError('failed')
}

async function registration() {
  if (!pushConfig() || !pushSupported()) throw new PushError('unsupported')
  // w dev nie ma service workera, a ready czekałoby w nieskończoność
  const reg = await navigator.serviceWorker.getRegistration()
  if (!reg) throw new PushError('failed')
  return reg
}

// musi być wołane z kliknięcia, inaczej Safari nie pokaże pytania o zgodę
export async function enableReminder(hour: number): Promise<Reminder> {
  const reg = await registration()
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new PushError('denied')
  let sub: PushSubscription
  try {
    sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKeyBytes(pushConfig()!.key),
      }))
  } catch {
    throw new PushError('failed')
  }
  try {
    await post('/push/subscribe', { subscription: { endpoint: sub.endpoint }, hour })
  } catch {
    throw new PushError('failed')
  }
  const r = { on: true, hour, endpoint: sub.endpoint }
  saveReminder(r)
  return r
}

export async function disableReminder(current: Reminder): Promise<Reminder> {
  const r = { ...current, on: false, endpoint: null }
  saveReminder(r)
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    const endpoint = sub?.endpoint ?? current.endpoint
    if (endpoint) await post('/push/unsubscribe', { endpoint }).catch(() => {})
    await sub?.unsubscribe()
  } catch {
    // lokalnie i tak jest wyłączone; martwą subskrypcję worker usunie przy 410
  }
  return r
}

export function setReminderHour(current: Reminder, hour: number): Promise<Reminder> | Reminder {
  if (!current.on) {
    const r = { ...current, hour }
    saveReminder(r)
    return r
  }
  return enableReminder(hour)
}

export function shouldPing(r: Reminder, lastPing: string | null, today: string) {
  return r.on && !!r.endpoint && lastPing !== today
}

// po każdej powtórce czy ćwiczeniu; do workera idzie najwyżej raz dziennie
export function notePushActivity(now = new Date()) {
  if (!pushConfig()) return
  const today = dayKey(now)
  let last: string | null
  try {
    last = localStorage.getItem(PING_KEY)
  } catch {
    return
  }
  const r = loadReminder()
  if (!shouldPing(r, last, today)) return
  post('/push/active', { endpoint: r.endpoint })
    .then(() => {
      try {
        localStorage.setItem(PING_KEY, today)
      } catch {
        // nic
      }
    })
    // offline: spróbuje przy następnej odpowiedzi
    .catch(() => {})
}
