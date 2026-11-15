// codzienne przypomnienie: pusty push (bez treści, więc nie trzeba szyfrować payloadu), tekst ma service worker

// tylko to, czego używam z KV, żeby nie ciągnąć całych typów Cloudflare
export interface Kv {
  get(key: string): Promise<string | null>
  getWithMetadata<M = unknown>(key: string): Promise<{ value: string | null; metadata: M | null }>
  put(key: string, value: string, opts?: { metadata?: unknown }): Promise<void>
  delete(key: string): Promise<void>
  list<M = unknown>(opts?: {
    prefix?: string
    cursor?: string
  }): Promise<{ keys: { name: string; metadata?: M }[]; list_complete: boolean; cursor?: string }>
}

export interface PushEnv {
  PUSH: Kv
  VAPID_PUBLIC_KEY: string
  // JWK jako JSON albo samo "d" w base64url (tak wypluwa web-push generate-vapid-keys)
  VAPID_PRIVATE_KEY: string
  VAPID_SUBJECT: string
}

type Meta = { hour: number; active?: string }

const PREFIX = 'sub:'
const MAX_BODY = 4096
const MAX_ENDPOINT = 1024
// jeden użytkownik, kilka przeglądarek; limit tylko po to, żeby nikt nie zapchał KV
const MAX_SUBS = 20
const TTL = 4 * 60 * 60
// adresy usług push z przeglądarek; na inne hosty worker nic nie wysyła
const PUSH_HOSTS = [
  'fcm.googleapis.com',
  'push.services.mozilla.com',
  'push.apple.com',
  'notify.windows.com',
]

const warsaw = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Warsaw',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

export function warsawNow(at: Date | number) {
  const parts = Object.fromEntries(warsaw.formatToParts(at).map((p) => [p.type, p.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour) }
}

export function b64url(bytes: Uint8Array | ArrayBuffer) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let s = ''
  for (const b of arr) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export function isPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== 'string' || endpoint.length > MAX_ENDPOINT) return false
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return false
  }
  if (url.protocol !== 'https:') return false
  return PUSH_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))
}

async function keyFor(endpoint: string) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return PREFIX + b64url(hash)
}

function privateJwk(env: PushEnv): JsonWebKey {
  const raw = env.VAPID_PRIVATE_KEY.trim()
  if (raw.startsWith('{')) return JSON.parse(raw) as JsonWebKey
  // klucz publiczny to 0x04 || x || y, z niego biorę x i y do JWK
  const pub = fromB64url(env.VAPID_PUBLIC_KEY.trim())
  return {
    kty: 'EC',
    crv: 'P-256',
    d: raw,
    x: b64url(pub.slice(1, 33)),
    y: b64url(pub.slice(33, 65)),
    ext: true,
  }
}

export async function vapidJwt(audience: string, subject: string, jwk: JsonWebKey, now: number) {
  const enc = (o: unknown) => b64url(new TextEncoder().encode(JSON.stringify(o)))
  const unsigned = `${enc({ typ: 'JWT', alg: 'ES256' })}.${enc({
    aud: audience,
    exp: Math.floor(now / 1000) + 12 * 60 * 60,
    sub: subject,
  })}`
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  )
  // WebCrypto oddaje podpis jako r||s, czyli dokładnie w formacie JWS
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(unsigned),
  )
  return `${unsigned}.${b64url(sig)}`
}

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  const text = await req.text()
  if (text.length > MAX_BODY) return null
  try {
    const body = JSON.parse(text) as unknown
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

type Reply = (body: unknown, status: number) => Response

export async function subscribe(req: Request, env: PushEnv, reply: Reply) {
  const body = await readBody(req)
  const sub = body?.subscription as { endpoint?: unknown } | undefined
  const hour = body?.hour
  if (!sub || !isPushEndpoint(sub.endpoint)) return reply({ error: 'bad_request' }, 400)
  if (typeof hour !== 'number' || !Number.isInteger(hour) || hour < 0 || hour > 23)
    return reply({ error: 'bad_request' }, 400)

  const key = await keyFor(sub.endpoint)
  const old = await env.PUSH.getWithMetadata<Meta>(key)
  if (!old.value) {
    const { keys } = await env.PUSH.list({ prefix: PREFIX })
    if (keys.length >= MAX_SUBS) return reply({ error: 'too_many' }, 429)
  }
  // zmiana godziny nie kasuje tego, że dziś już coś było zrobione
  const meta: Meta = { hour, active: old.metadata?.active }
  await env.PUSH.put(key, sub.endpoint, { metadata: meta })
  return reply({ ok: true }, 200)
}

export async function unsubscribe(req: Request, env: PushEnv, reply: Reply) {
  const body = await readBody(req)
  if (!body || !isPushEndpoint(body.endpoint)) return reply({ error: 'bad_request' }, 400)
  await env.PUSH.delete(await keyFor(body.endpoint))
  return reply({ ok: true }, 200)
}

export async function markActive(req: Request, env: PushEnv, reply: Reply, now = Date.now()) {
  const body = await readBody(req)
  if (!body || !isPushEndpoint(body.endpoint)) return reply({ error: 'bad_request' }, 400)
  const key = await keyFor(body.endpoint)
  const { value, metadata } = await env.PUSH.getWithMetadata<Meta>(key)
  if (!value || !metadata) return reply({ error: 'not_found' }, 404)
  const today = warsawNow(now).date
  // KV na darmowym planie ma limit zapisów, więc drugi raz tego samego dnia nic nie piszę
  if (metadata.active !== today) {
    const meta: Meta = { hour: metadata.hour, active: today }
    await env.PUSH.put(key, value, { metadata: meta })
  }
  return reply({ ok: true }, 200)
}

export async function sendReminders(env: PushEnv, now: number) {
  const { date, hour } = warsawNow(now)
  const due: string[] = []
  let cursor: string | undefined
  do {
    const page = await env.PUSH.list<Meta>({ prefix: PREFIX, cursor })
    for (const k of page.keys) {
      if (k.metadata?.hour === hour && k.metadata.active !== date) due.push(k.name)
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
  if (!due.length) return 0

  const jwk = privateJwk(env)
  const publicKey = env.VAPID_PUBLIC_KEY.trim()
  let sent = 0
  for (const key of due) {
    const endpoint = await env.PUSH.get(key)
    if (!endpoint) continue
    try {
      const jwt = await vapidJwt(new URL(endpoint).origin, env.VAPID_SUBJECT, jwk, now)
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `vapid t=${jwt}, k=${publicKey}`,
          TTL: String(TTL),
          Urgency: 'normal',
          'Content-Length': '0',
        },
      })
      // subskrypcja wygasła albo ktoś wyłączył powiadomienia w przeglądarce
      if (res.status === 404 || res.status === 410) await env.PUSH.delete(key)
      else if (res.ok) sent += 1
    } catch {
      // jedna nieudana nie może zatrzymać reszty
    }
  }
  return sent
}
