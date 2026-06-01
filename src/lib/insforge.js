import { createClient } from '@insforge/sdk'

let _client = null

export function getInsforgeClient() {
  if (!_client) {
    _client = createClient({
      baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL,
      anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY,
    })
  }
  return _client
}

// Named singleton for convenience in client components
export const insforge = typeof window !== 'undefined' ? getInsforgeClient() : null
