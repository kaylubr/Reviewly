import { createClient } from '@insforge/sdk'

export const insforge = createClient({
  baseUrl: process.env.INSFORGE_URL,
  anonKey: process.env.INSFORGE_API_KEY  // admin client uses api_key
})
