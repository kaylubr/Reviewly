import { insforge } from './insforge'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const ANON_KEY = import.meta.env.VITE_INSFORGE_ANON_KEY

async function getFreshToken(fallback) {
  // Use the SDK's current token — it's updated automatically on any InsForge call.
  // If the token is expired the API returns 401 and the user is redirected to login.
  const sdkAuth = insforge.getHttpClient().getHeaders()['Authorization'] || ''
  const sdkToken = sdkAuth.replace('Bearer ', '')
  if (sdkToken && sdkToken !== ANON_KEY) return sdkToken
  if (fallback && fallback !== ANON_KEY) return fallback
  return null
}

export async function apiRequest(path, options = {}, token = null) {
  const authToken = await getFreshToken(token)
  console.log(`[api] ${options.method || 'GET'} ${path} | token: ${authToken ? authToken.substring(0, 20) + '...' : 'NONE'}`)
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}
