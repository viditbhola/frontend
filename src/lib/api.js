import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

async function authHeader() {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Render's free tier sleeps; retry network failures with backoff so a cold start does not look like an error.
async function fetchWithRetry(url, options, onWaking) {
  const delays = [0, 3000, 8000, 15000]
  for (const delay of delays) {
    if (delay) {
      onWaking?.()
      await sleep(delay)
    }
    try {
      return await fetch(url, options)
    } catch {
      // network failure or cold start: fall through and retry
    }
  }
  throw new ApiError('Cannot reach the server. Please try again.', 0)
}

export async function api(path, { method = 'GET', body, form, onWaking } = {}) {
  const headers = { ...(await authHeader()) }
  let payload
  if (form) {
    payload = form
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  const res = await fetchWithRetry(`${BASE}${path}`, { method, headers, body: payload }, onWaking)
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = Array.isArray(data?.detail) ? data.detail.map((d) => d.msg).join(', ') : data?.detail
    throw new ApiError(detail || `Request failed (${res.status})`, res.status)
  }
  return data
}
