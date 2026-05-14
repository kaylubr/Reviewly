import { createClient } from '@insforge/sdk'
import { logger } from '../lib/logger.js'

/**
 * Extract and verify user from Authorization header.
 * Returns 401 if missing or invalid.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('auth', 'Missing authorization header')
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  const token = authHeader.split(' ')[1]
  logger.debug('auth', `Token prefix: ${token?.substring(0, 20)}...`)

  // Create a user-scoped client to verify the token (isServerMode uses token directly, not localStorage)
  const userClient = createClient({
    baseUrl: process.env.INSFORGE_URL,
    anonKey: process.env.INSFORGE_ANON_KEY,
    isServerMode: true
  })
  userClient.setAccessToken(token)

  const { data, error } = await userClient.auth.getCurrentUser()
  if (error || !data?.user) {
    logger.warn('auth', `Token rejected: ${error?.message || 'no user returned'}`)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
  // Reject the anonymous placeholder user (InsForge accepts anon key but it's not a real user)
  if (data.user.id === '12345678-1234-5678-90ab-cdef12345678') {
    logger.warn('auth', 'Rejected anon placeholder user')
    return res.status(401).json({ error: 'Not authenticated' })
  }

  logger.debug('auth', `Authenticated user: ${data.user.id}`)
  req.user = data.user
  req.userToken = token
  next()
}
