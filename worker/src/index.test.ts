import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { type Env } from './index'

const env: Env = {
  DEEPL_API_KEY: 'test-key:fx',
  ALLOWED_ORIGIN: 'https://app.example, http://localhost:5173',
}
const origin = 'https://app.example'

function post(body: unknown, from = origin) {
  return new Request('https://worker.test/translate', {
    method: 'POST',
    headers: { Origin: from, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function mockDeepl(status: number, body: unknown = {}) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('worker', () => {
  it('odrzuca obce originy i zapytania bez Origin', async () => {
    const fn = mockDeepl(200)
    expect(
      (await worker.fetch(post({ text: 'hi', direction: 'en-pl' }, 'https://evil.example'), env))
        .status,
    ).toBe(403)
    const noOrigin = new Request('https://worker.test/usage')
    expect((await worker.fetch(noOrigin, env)).status).toBe(403)
    expect(fn).not.toHaveBeenCalled()
  })

  it('odpowiada na preflight z nagłówkami CORS', async () => {
    const res = await worker.fetch(
      new Request('https://worker.test/translate', {
        method: 'OPTIONS',
        headers: { Origin: origin },
      }),
      env,
    )
    expect(res.status).toBe(204)
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(origin)
  })

  it('tłumaczy i wysyła klucz tylko do DeepL', async () => {
    const fn = mockDeepl(200, { translations: [{ text: 'Nie mogę się doczekać.' }] })
    const res = await worker.fetch(post({ text: " I can't wait. ", direction: 'en-pl' }), env)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ translation: 'Nie mogę się doczekać.' })
    const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://api-free.deepl.com/v2/translate')
    expect((init.headers as Record<string, string>).Authorization).toBe(
      'DeepL-Auth-Key test-key:fx',
    )
    expect(JSON.parse(init.body as string)).toEqual({
      text: ["I can't wait."],
      source_lang: 'EN',
      target_lang: 'PL',
    })
  })

  it('pilnuje długości tekstu', async () => {
    const fn = mockDeepl(200)
    const res = await worker.fetch(post({ text: 'a'.repeat(501), direction: 'pl-en' }), env)
    expect(res.status).toBe(413)
    expect((await worker.fetch(post({ text: '   ', direction: 'pl-en' }), env)).status).toBe(400)
    expect(fn).not.toHaveBeenCalled()
  })

  it('zamienia 456 z DeepL na czytelny błąd limitu', async () => {
    mockDeepl(456, { message: 'Quota exceeded' })
    const res = await worker.fetch(post({ text: 'cześć', direction: 'pl-en' }), env)
    expect(res.status).toBe(456)
    expect(await res.json()).toEqual({ error: 'quota_exceeded' })
  })

  it('zły klucz albo awaria DeepL to 502 bez szczegółów', async () => {
    mockDeepl(403, { message: 'Wrong key test-key:fx' })
    const res = await worker.fetch(post({ text: 'cześć', direction: 'pl-en' }), env)
    expect(res.status).toBe(502)
    expect(JSON.stringify(await res.json())).not.toContain('test-key')
  })

  it('/usage zwraca zużycie znaków', async () => {
    mockDeepl(200, { character_count: 1200, character_limit: 500000 })
    const res = await worker.fetch(
      new Request('https://worker.test/usage', { headers: { Origin: origin } }),
      env,
    )
    expect(await res.json()).toEqual({ count: 1200, limit: 500000 })
  })
})
