/**
 * Frontend calls your Railway API (or local dev server).
 * - Same-origin: leave VITE_AI_API_BASE_URL unset; use relative `/api` (Express serves SPA + API).
 * - Split deploy: set VITE_AI_API_BASE_URL to your Railway service URL at build time.
 */

export function aiApiRoot(): string {
  const env = import.meta.env.VITE_AI_API_BASE_URL as string | undefined
  return env?.replace(/\/$/, '') ?? ''
}

export async function postAiJson<T>(
  path: string,
  body: Record<string, unknown>
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const root = aiApiRoot()
  const url = root ? `${root}${path.startsWith('/') ? path : `/${path}`}` : path

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (e) {
    return {
      ok: false,
      status: 0,
      message: e instanceof Error ? e.message : 'Network error',
    }
  }

  const text = await res.text()
  let data: unknown
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    return { ok: false, status: res.status, message: text || 'Invalid JSON response' }
  }

  if (!res.ok) {
    const err = (data as { error?: string })?.error
    return { ok: false, status: res.status, message: err || `HTTP ${res.status}` }
  }

  return { ok: true, data: data as T }
}

export type FaqResult = { answer: string }
export type DocResult = { answer: string }
export type TextResult = { answer: string }
