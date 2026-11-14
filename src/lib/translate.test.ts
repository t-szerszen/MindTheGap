import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchUsage, translate, TranslateError } from './translate'

const url = 'https://worker.test/'

function respond(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status })),
  )
}

async function kindOf(p: Promise<unknown>) {
  try {
    await p
  } catch (e) {
    return e instanceof TranslateError ? e.kind : 'other'
  }
  return 'none'
}

afterEach(() => vi.unstubAllGlobals())

describe('translate', () => {
  it('zwraca tłumaczenie i nie dubluje ukośnika w adresie', async () => {
    respond(200, { translation: 'in the long run' })
    expect(await translate('na dłuższą metę', 'pl-en', { url })).toBe('in the long run')
    expect(vi.mocked(fetch).mock.calls[0]![0]).toBe('https://worker.test/translate')
  })

  it('bez adresu workera nawet nie próbuje', async () => {
    expect(await kindOf(translate('x', 'pl-en', {}))).toBe('not_configured')
  })

  it('mapuje błędy workera', async () => {
    respond(456, { error: 'quota_exceeded' })
    expect(await kindOf(translate('x', 'pl-en', { url }))).toBe('quota')
    respond(502, { error: 'upstream_error' })
    expect(await kindOf(translate('x', 'pl-en', { url }))).toBe('worker_down')
    respond(413, { error: 'too_long' })
    expect(await kindOf(translate('x', 'pl-en', { url }))).toBe('too_long')
  })

  it('brak sieci rozróżnia offline od padniętego workera', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    )
    vi.stubGlobal('navigator', { onLine: false })
    expect(await kindOf(translate('x', 'pl-en', { url }))).toBe('offline')
    vi.stubGlobal('navigator', { onLine: true })
    expect(await kindOf(translate('x', 'pl-en', { url }))).toBe('worker_down')
  })
})

describe('fetchUsage', () => {
  it('zwraca liczby albo null', async () => {
    respond(200, { count: 10, limit: 500000 })
    expect(await fetchUsage({ url })).toEqual({ count: 10, limit: 500000 })
    respond(500, {})
    expect(await fetchUsage({ url })).toBeNull()
    expect(await fetchUsage({})).toBeNull()
  })
})
