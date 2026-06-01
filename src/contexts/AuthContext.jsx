'use client'
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getInsforgeClient } from '@/lib/insforge'
import { apiRequest } from '@/lib/api'

const AuthContext = createContext(null)
const AUTH_STORAGE_KEY = 'reviewly_auth_session'

function savePersistedSession(session) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  } catch {
    // Ignore if storage is unavailable
  }
}

function clearPersistedSession() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  } catch {
    // Ignore if storage is unavailable
  }
}

function getPersistedSession() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const hydrated = useRef(false)

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    async function hydrateAuth() {
      const insforge = getInsforgeClient()
      const urlParams = new URLSearchParams(window.location.search)
      const oauthCode = urlParams.get('insforge_code')

      if (oauthCode) {
        // The SDK auto-detects and exchanges PKCE auth codes during initialization.
        await insforge.auth.authCallbackHandled
      }

      const { data, error } = await insforge.auth.getCurrentUser()
      if (error || !data?.user) {
        const savedSession = getPersistedSession()
        if (savedSession?.accessToken && savedSession?.user) {
          const { accessToken, user: savedUser } = savedSession
          if (insforge.auth?.tokenManager?.saveSession) {
            insforge.auth.tokenManager.saveSession({ accessToken, user: savedUser })
          }
          insforge.getHttpClient().setAuthToken(accessToken)
          setUser(savedUser)
          setToken(accessToken)
          await loadProfile(accessToken)
          return
        }

        try { await insforge.auth.signOut() } catch (_) {}
        setLoading(false)
        return
      }

      setUser(data.user)
      const headers = insforge.getHttpClient().getHeaders()
      const t = headers['Authorization']?.replace('Bearer ', '') || null
      setToken(t)
      if (t) {
        savePersistedSession({ accessToken: t, user: data.user })
        await loadProfile(t)
        return
      }
      setLoading(false)
    }

    void hydrateAuth()
  }, [])

  async function loadProfile(t) {
    try {
      const data = await apiRequest('/api/profile', {}, t)
      setProfile(data)
    } catch (e) {
      console.error('[auth] loadProfile failed:', e.message)
    } finally {
      setLoading(false)
    }
  }

  async function refreshProfile() {
    if (token) await loadProfile(token)
  }

  async function handleAuthSuccess(userData, accessToken) {
    setUser(userData)
    setToken(accessToken)
    savePersistedSession({ accessToken, user: userData })
    await loadProfile(accessToken)
  }

  async function signOut() {
    const insforge = getInsforgeClient()
    await insforge.auth.signOut()
    clearPersistedSession()
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
