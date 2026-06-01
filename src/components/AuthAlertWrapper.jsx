'use client'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import TokenExpirationAlert from './TokenExpirationAlert'

export function AuthAlertWrapper({ children }) {
  const { tokenExpired, handleTokenExpired, handleExpiredLogout, dismissTokenExpiredAlert } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleTokenExpiredEvent = () => {
      handleTokenExpired()
    }

    window.addEventListener('tokenExpired', handleTokenExpiredEvent)
    return () => window.removeEventListener('tokenExpired', handleTokenExpiredEvent)
  }, [handleTokenExpired])

  const handleLogout = async () => {
    await handleExpiredLogout()
    router.push('/auth')
  }

  return (
    <>
      <TokenExpirationAlert
        isVisible={tokenExpired}
        onDismiss={dismissTokenExpiredAlert}
        onLogout={handleLogout}
      />
      {children}
    </>
  )
}
