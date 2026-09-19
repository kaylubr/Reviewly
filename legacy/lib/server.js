import { createClient } from '@insforge/sdk'

// Server-side admin client with API key (for Next.js API routes)
export function getAdminClient() {
  return createClient({
    baseUrl: process.env.INSFORGE_URL,
    anonKey: process.env.INSFORGE_API_KEY,
    isServerMode: true,
  })
}

// Verify a user's Bearer token and return the user object
// Returns { user } on success or throws an error
export async function requireAuth(request) {
  const authHeader = request.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '').trim()

  if (!token) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }

  // Create user-scoped client using the anon key
  const userClient = createClient({
    baseUrl: process.env.INSFORGE_URL,
    anonKey: process.env.INSFORGE_ANON_KEY,
    isServerMode: true,
  })
  userClient.setAccessToken(token)

  const { data, error } = await userClient.auth.getCurrentUser()

  // Reject if no valid user or if the user ID is the anonymous placeholder
  const ANON_USER_ID = '12345678-1234-5678-90ab-cdef12345678'
  if (error || !data?.user || data.user.id === ANON_USER_ID) {
    throw Object.assign(new Error('Unauthorized'), { status: 401 })
  }

  return { user: data.user, token }
}
