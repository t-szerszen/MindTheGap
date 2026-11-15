// pośrednik do DeepL: przeglądarka nie może wołać DeepL bezpośrednio (CORS), a klucz nie może trafić do aplikacji

export interface Env {
  DEEPL_API_KEY: string
  // jeden adres albo kilka po przecinku, np. https://login.github.io,http://localhost:5173
  ALLOWED_ORIGIN: string
}

const DEEPL = 'https://api-free.deepl.com'
const MAX_CHARS = 500

const langs = {
  'pl-en': { source_lang: 'PL', target_lang: 'EN-GB' },
  'en-pl': { source_lang: 'EN', target_lang: 'PL' },
} as const

function cors(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, origin?: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...(origin ? cors(origin) : {}) },
  })
}

function deeplHeaders(env: Env) {
  return {
    Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`,
    'Content-Type': 'application/json',
  }
}

// błędy DeepL tłumaczone na proste kody, które aplikacja zamienia na polskie komunikaty
function upstreamError(status: number, origin: string) {
  if (status === 456) return json({ error: 'quota_exceeded' }, 456, origin)
  if (status === 429) return json({ error: 'rate_limited' }, 429, origin)
  if (status === 403) return json({ error: 'upstream_auth' }, 502, origin)
  return json({ error: 'upstream_error' }, 502, origin)
}

async function translate(req: Request, env: Env, origin: string) {
  let body: { text?: unknown; direction?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'bad_request' }, 400, origin)
  }
  const text = typeof body.text === 'string' ? body.text.trim() : ''
  const direction = body.direction === 'pl-en' || body.direction === 'en-pl' ? body.direction : null
  if (!direction) return json({ error: 'bad_request' }, 400, origin)
  if (!text) return json({ error: 'empty' }, 400, origin)
  if (text.length > MAX_CHARS) return json({ error: 'too_long', max: MAX_CHARS }, 413, origin)

  let res: Response
  try {
    res = await fetch(`${DEEPL}/v2/translate`, {
      method: 'POST',
      headers: deeplHeaders(env),
      body: JSON.stringify({ text: [text], ...langs[direction] }),
    })
  } catch {
    return json({ error: 'upstream_unreachable' }, 502, origin)
  }
  if (!res.ok) return upstreamError(res.status, origin)

  const data = (await res.json()) as { translations?: { text?: string }[] }
  const translation = data.translations?.[0]?.text
  if (!translation) return json({ error: 'upstream_error' }, 502, origin)
  return json({ translation }, 200, origin)
}

async function usage(env: Env, origin: string) {
  let res: Response
  try {
    res = await fetch(`${DEEPL}/v2/usage`, { headers: deeplHeaders(env) })
  } catch {
    return json({ error: 'upstream_unreachable' }, 502, origin)
  }
  if (!res.ok) return upstreamError(res.status, origin)
  const data = (await res.json()) as { character_count?: number; character_limit?: number }
  return json({ count: data.character_count ?? 0, limit: data.character_limit ?? 0 }, 200, origin)
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const origin = req.headers.get('Origin') ?? ''
    const allowed = (env.ALLOWED_ORIGIN ?? '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
    // bez nagłówka Origin (np. curl) też odmawiamy
    if (!allowed.includes(origin)) return json({ error: 'forbidden_origin' }, 403)
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })

    const { pathname } = new URL(req.url)
    if (pathname === '/translate' && req.method === 'POST') return translate(req, env, origin)
    if (pathname === '/usage' && req.method === 'GET') return usage(env, origin)
    return json({ error: 'not_found' }, 404, origin)
  },
}
