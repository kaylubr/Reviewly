'use client'
import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Navbar from '@/components/Navbar'

export default function AppLayout({ children }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <span className="spinner-lg" />
      </div>
    )
  }

  if (!user) return null

  // Completely hide sidebar on review pages
  const isReviewPage = pathname?.includes('/review/')
  const hideSidebar = isReviewPage

  return (
    <div className={`app-layout ${hideSidebar ? 'sidebar-hidden' : ''}`}>
      {!isReviewPage && <Navbar />}
      <main className="main-content">{children}</main>
    </div>
  )
}
