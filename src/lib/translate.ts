// klient workera z tłumaczeniem; żadnego Reacta tutaj, tylko fetch

export type Direction = 'pl-en' | 'en-pl'

export type TranslateErrorKind =
  'not_configured' | 'offline' | 'quota' | 'rate_limited' | 'too_long' | 'worker_down'

export class TranslateError extends Error {
  kind: TranslateErrorKind
  constructor(kind: TranslateErrorKind) {
    super(kind)
    this.kind = kind
  }
}

export const MAX_CHARS = 500

function baseUrl(url?: string) {
  return url?.replace(/\/+$/, '') || undefined
}

function errorFor(status: number): TranslateErrorKind {
  if (status === 456) return 'quota'
  if (status === 429) return 'rate_limited'
  if (status === 413) return 'too_long'
  return 'worker_down'
}

export async function translate(
  text: string,
  direction: Direction,
  opts: { url?: string; signal?: AbortSignal } = {},
): Promise<string> {
  const url = baseUrl(opts.url)
  if (!url) throw new TranslateError('not_configured')
  if (text.length > MAX_CHARS) throw new TranslateError('too_long')
  let res: Response
  try {
    res = await fetch(`${url}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, direction }),
      signal: opts.signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new TranslateError(navigator.onLine === false ? 'offline' : 'worker_down')
  }
  if (!res.ok) throw new TranslateError(errorFor(res.status))
  const data = (await res.json()) as { translation?: string }
  if (!data.translation) throw new TranslateError('worker_down')
  return data.translation
}

export type Usage = { count: number; limit: number }

export async function fetchUsage(opts: { url?: string } = {}): Promise<Usage | null> {
  const url = baseUrl(opts.url)
  if (!url) return null
  try {
    const res = await fetch(`${url}/usage`)
    if (!res.ok) return null
    const data = (await res.json()) as Partial<Usage>
    return typeof data.count === 'number' && typeof data.limit === 'number'
      ? { count: data.count, limit: data.limit }
      : null
  } catch {
    return null
  }
}
