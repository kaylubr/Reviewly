'use client'
import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getInsforgeClient } from '@/lib/insforge'
import { apiRequest } from '@/lib/api'

const AuthContext = createContext(null)

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
        window.history.replaceState({}, '', window.location.pathname)
        try {
          const { data, error } = await insforge.auth.exchangeOAuthCode(oauthCode)
          if (error) throw error
          if (data?.user && data?.accessToken) {
            setUser(data.user)
            setToken(data.accessToken)
            await loadProfile(data.accessToken)
            return
          }
        } catch (e) {
          console.error('[auth] OAuth code exchange failed:', e.message)
          setLoading(false)
          return
        }
      }

      const { data, error } = await insforge.auth.getCurrentUser()
      if (error || !data?.user) {
        try { await insforge.auth.signOut() } catch (_) {}
        setLoading(false)
        return
      }

      setUser(data.user)
      const headers = insforge.getHttpClient().getHeaders()
      const t = headers['Authorization']?.replace('Bearer ', '') || null
      setToken(t)
      if (t) {
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
    await loadProfile(accessToken)
  }

  async function signOut() {
    const insforge = getInsforgeClient()
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
