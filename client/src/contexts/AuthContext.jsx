import { createContext, useContext, useState, useEffect } from 'react'
import { insforge } from '../lib/insforge'
import { apiRequest } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function hydrateAuth() {
      const { data, error } = await insforge.auth.getCurrentUser()
      if (cancelled) return
      if (!error && data?.user) {
        setUser(data.user)
        // Access token is stored internally by the SDK after session refresh
        const headers = insforge.getHttpClient().getHeaders()
        const t = headers['Authorization']?.replace('Bearer ', '') || null
        console.log('[auth] hydrateAuth user:', data.user?.id, '| token:', t ? t.substring(0, 20) + '...' : 'NULL')
        setToken(t)
        if (t) {
          await loadProfile(t)
          return
        }
      }
      setLoading(false)
    }

    void hydrateAuth()
    return () => { cancelled = true }
  }, [])

  async function loadProfile(t) {
    try {
      const data = await apiRequest('/api/profile', {}, t)
      setProfile(data)
    } catch (e) {
      console.error('Failed to load profile:', e)
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (token) await loadProfile(token)
  }

  // Called by Auth page after successful sign-in / sign-up / verify
  async function handleAuthSuccess(userData, accessToken) {
    setUser(userData)
    setToken(accessToken)
    await loadProfile(accessToken)
  }

  async function signOut() {
    await insforge.auth.signOut()
    setUser(null)
    setProfile(null)
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, signOut, refreshProfile, handleAuthSuccess }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
