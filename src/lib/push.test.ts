import { describe, expect, it } from 'vitest'
import { DEFAULT_HOUR, parseReminder, pushConfig, shouldPing, vapidKeyBytes } from './push'

describe('push', () => {
  it('konfiguracja: osobny adres albo ten od tłumacza, bez klucza nic', () => {
    expect(pushConfig({ VITE_TRANSLATE_API_URL: 'https://w.test/' })).toBeNull()
    expect(
      pushConfig({ VITE_TRANSLATE_API_URL: 'https://w.test/', VITE_VAPID_PUBLIC_KEY: ' BKey ' }),
    ).toEqual({ url: 'https://w.test', key: 'BKey' })
    expect(
      pushConfig({
        VITE_TRANSLATE_API_URL: 'https://w.test',
        VITE_PUSH_API_URL: 'https://p.test',
        VITE_VAPID_PUBLIC_KEY: 'BKey',
      })?.url,
    ).toBe('https://p.test')
  })

  it('klucz VAPID z base64url na bajty', () => {
    expect([...vapidKeyBytes('BP-_')]).toEqual([4, 255, 191])
  })

  it('zapisany stan: złe dane dają domyślną godzinę i wyłączone', () => {
    expect(parseReminder(null)).toEqual({ on: false, hour: DEFAULT_HOUR, endpoint: null })
    expect(parseReminder('{"on":true,"hour":25}')).toEqual({
      on: false,
      hour: DEFAULT_HOUR,
      endpoint: null,
    })
    expect(parseReminder('{"on":true,"hour":7,"endpoint":"https://e"}')).toEqual({
      on: true,
      hour: 7,
      endpoint: 'https://e',
    })
  })

  it('aktywność wysyłam raz dziennie i tylko z włączonym przypomnieniem', () => {
    const on = { on: true, hour: 18, endpoint: 'https://e' }
    expect(shouldPing(on, null, '2026-11-15')).toBe(true)
    expect(shouldPing(on, '2026-11-14', '2026-11-15')).toBe(true)
    expect(shouldPing(on, '2026-11-15', '2026-11-15')).toBe(false)
    expect(shouldPing({ ...on, on: false }, null, '2026-11-15')).toBe(false)
  })
})
