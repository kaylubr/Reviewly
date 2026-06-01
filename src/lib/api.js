'use client'
import { getInsforgeClient } from './insforge'

export async function apiRequest(path, options = {}, token = null) {
  const insforge = getInsforgeClient()
  const ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY

  // Prefer explicitly-passed token, then fall back to SDK's current header
  const sdkAuth = insforge.getHttpClient().getHeaders()['Authorization'] || ''
  const sdkToken = sdkAuth.replace('Bearer ', '')

  const authToken =
    token && token !== ANON_KEY ? token :
    sdkToken && sdkToken !== ANON_KEY ? sdkToken :
    null

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  }

  let res
  try {
    res = await fetch(path, { ...options, headers })
  } catch (err) {
    throw new Error('Network request failed. Please check your connection and try again.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}
