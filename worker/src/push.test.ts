import { afterEach, describe, expect, it, vi } from 'vitest'
import worker, { type Env } from './index'
import { b64url, fromB64url, isPushEndpoint, vapidJwt, warsawNow, type Kv } from './push'

function memoryKv() {
  const data = new Map<string, { value: string; metadata?: unknown }>()
  const kv: Kv = {
    async get(k) {
      return data.get(k)?.value ?? null
    },
    async getWithMetadata<M>(k: string) {
      const e = data.get(k)
      return { value: e?.value ?? null, metadata: (e?.metadata ?? null) as M | null }
    },
    async put(k, value, opts) {
      data.set(k, { value, metadata: opts?.metadata })
    },
    async delete(k) {
      data.delete(k)
    },
    async list<M>(opts?: { prefix?: string }) {
      const keys = [...data.entries()]
        .filter(([k]) => k.startsWith(opts?.prefix ?? ''))
        .map(([name, e]) => ({ name, metadata: e.metadata as M }))
      return { keys, list_complete: true }
    },
  }
  return { kv, data }
}

async function vapidKeys() {
  const pair = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ])) as CryptoKeyPair
  const pub = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey))
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey)
  return { pair, publicKey: b64url(pub), d: jwk.d!, jwk }
}

const origin = 'https://app.example'
const endpoint = 'https://fcm.googleapis.com/fcm/send/abc123'

async function setup() {
  const { kv, data } = memoryKv()
  const keys = await vapidKeys()
  const env: Env = {
    DEEPL_API_KEY: 'x',
    ALLOWED_ORIGIN: origin,
    PUSH: kv,
    VAPID_PUBLIC_KEY: keys.publicKey,
    VAPID_PRIVATE_KEY: keys.d,
    VAPID_SUBJECT: 'mailto:test@example.com',
  }
  return { env, data, keys }
}

function post(path: string, body: unknown, from = origin) {
  return new Request(`https://worker.test${path}`, {
    method: 'POST',
    headers: { Origin: from, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// 2026-11-15 17:00 UTC = 18:00 w Warszawie (czas zimowy)
const at18 = Date.UTC(2026, 10, 15, 17, 0)

afterEach(() => vi.unstubAllGlobals())

describe('pomocnicze', () => {
  it('liczy godzinę i datę po warszawsku, także przez zmianę czasu', () => {
    expect(warsawNow(at18)).toEqual({ date: '2026-11-15', hour: 18 })
    expect(warsawNow(Date.UTC(2026, 6, 1, 22, 30))).toEqual({ date: '2026-07-02', hour: 0 })
    expect(warsawNow(Date.UTC(2026, 11, 31, 23, 0))).toEqual({ date: '2027-01-01', hour: 0 })
  })

  it('base64url w obie strony', () => {
    const bytes = new Uint8Array([0, 251, 255, 62, 63, 1])
    expect(b64url(bytes)).not.toMatch(/[+/=]/)
    expect([...fromB64url(b64url(bytes))]).toEqual([...bytes])
  })

  it('przepuszcza tylko adresy usług push', () => {
    expect(isPushEndpoint(endpoint)).toBe(true)
    expect(isPushEndpoint('https://web.push.apple.com/QGx')).toBe(true)
    expect(isPushEndpoint('http://fcm.googleapis.com/x')).toBe(false)
    expect(isPushEndpoint('https://evil.example/fcm.googleapis.com')).toBe(false)
    expect(isPushEndpoint('https://fcm.googleapis.com.evil.example/x')).toBe(false)
    expect(isPushEndpoint(`https://fcm.googleapis.com/${'a'.repeat(2000)}`)).toBe(false)
  })

  it('JWT VAPID ma dobry podpis ES256', async () => {
    const { pair, jwk } = await vapidKeys()
    const jwt = await vapidJwt('https://fcm.googleapis.com', 'mailto:a@b.c', jwk, at18)
    const [h, p, s] = jwt.split('.')
    expect(JSON.parse(new TextDecoder().decode(fromB64url(h)))).toEqual({
      typ: 'JWT',
      alg: 'ES256',
    })
    const claims = JSON.parse(new TextDecoder().decode(fromB64url(p)))
    expect(claims.aud).toBe('https://fcm.googleapis.com')
    expect(claims.exp).toBe(at18 / 1000 + 12 * 3600)
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      pair.publicKey,
      fromB64url(s),
      new TextEncoder().encode(`${h}.${p}`),
    )
    expect(ok).toBe(true)
  })
})

describe('endpointy push', () => {
  it('odrzuca obcy origin i złe dane', async () => {
    const { env, data } = await setup()
    const sub = { subscription: { endpoint }, hour: 18 }
    expect(
      (await worker.fetch(post('/push/subscribe', sub, 'https://evil.example'), env)).status,
    ).toBe(403)
    expect((await worker.fetch(post('/push/subscribe', { ...sub, hour: 24 }), env)).status).toBe(
      400,
    )
    expect((await worker.fetch(post('/push/subscribe', { ...sub, hour: 1.5 }), env)).status).toBe(
      400,
    )
    expect(
      (
        await worker.fetch(
          post('/push/subscribe', { subscription: { endpoint: 'https://x.y' }, hour: 1 }),
          env,
        )
      ).status,
    ).toBe(400)
    expect(
      (await worker.fetch(post('/push/subscribe', { ...sub, pad: 'a'.repeat(5000) }), env)).status,
    ).toBe(400)
    expect(data.size).toBe(0)
  })

  it('bez konfiguracji push zwraca 503, a tłumacz działa dalej', async () => {
    const env: Env = { DEEPL_API_KEY: 'x', ALLOWED_ORIGIN: origin }
    const res = await worker.fetch(
      post('/push/subscribe', { subscription: { endpoint }, hour: 18 }),
      env,
    )
    expect(res.status).toBe(503)
  })

  it('zapis, aktywność i wypis', async () => {
    const { env, data } = await setup()
    await worker.fetch(post('/push/subscribe', { subscription: { endpoint }, hour: 18 }), env)
    expect(data.size).toBe(1)
    const [key] = [...data.keys()]
    expect(key).not.toContain('fcm')
    expect(data.get(key)?.metadata).toEqual({ hour: 18 })

    expect((await worker.fetch(post('/push/active', { endpoint }), env)).status).toBe(200)
    const active = (data.get(key)?.metadata as { active?: string }).active
    expect(active).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // zmiana godziny zostawia dzisiejszą aktywność
    await worker.fetch(post('/push/subscribe', { subscription: { endpoint }, hour: 7 }), env)
    expect(data.get(key)?.metadata).toEqual({ hour: 7, active })

    const other = 'https://fcm.googleapis.com/fcm/send/other'
    expect((await worker.fetch(post('/push/active', { endpoint: other }), env)).status).toBe(404)

    await worker.fetch(post('/push/unsubscribe', { endpoint }), env)
    expect(data.size).toBe(0)
  })
})

describe('cron', () => {
  it('wysyła pusty push tylko o właściwej godzinie i gdy dziś nic nie było', async () => {
    const { env, data, keys } = await setup()
    const kv = env.PUSH!
    await kv.put('sub:a', 'https://fcm.googleapis.com/fcm/send/a', { metadata: { hour: 18 } })
    await kv.put('sub:b', 'https://fcm.googleapis.com/fcm/send/b', {
      metadata: { hour: 18, active: '2026-11-15' },
    })
    await kv.put('sub:c', 'https://fcm.googleapis.com/fcm/send/c', { metadata: { hour: 9 } })
    await kv.put('sub:d', 'https://updates.push.services.mozilla.com/wpush/v2/d', {
      metadata: { hour: 18, active: '2026-11-14' },
    })
    const fn = vi.fn(
      async (url: string) => new Response(null, { status: url.includes('mozilla') ? 410 : 201 }),
    )
    vi.stubGlobal('fetch', fn)

    const waits: Promise<unknown>[] = []
    await worker.scheduled({ scheduledTime: at18 }, env, { waitUntil: (p) => waits.push(p) })
    await Promise.all(waits)

    const urls = fn.mock.calls.map((c) => c[0])
    expect(urls.sort()).toEqual([
      'https://fcm.googleapis.com/fcm/send/a',
      'https://updates.push.services.mozilla.com/wpush/v2/d',
    ])
    const init = (fn.mock.calls[0] as unknown as [string, RequestInit])[1]
    const headers = init.headers as Record<string, string>
    expect(init.body).toBeUndefined()
    expect(headers.TTL).toBe('14400')
    expect(headers.Urgency).toBe('normal')
    expect(headers.Authorization).toMatch(
      new RegExp(`^vapid t=[\\w-]+\\.[\\w-]+\\.[\\w-]+, k=${keys.publicKey}$`),
    )
    // 410 = subskrypcja nie żyje, więc znika
    expect(data.has('sub:d')).toBe(false)
    expect(data.has('sub:a')).toBe(true)
  })
})
