'use client'
import { createContext, useContext, useState, useMemo } from 'react'

const LoadingContext = createContext(null)

export function LoadingProvider({ children }) {
  const [count, setCount] = useState(0)
  const isLoading = count > 0

  const startLoading = () => setCount((current) => current + 1)
  const stopLoading = () => setCount((current) => Math.max(0, current - 1))
  const value = useMemo(() => ({ isLoading, startLoading, stopLoading }), [isLoading])

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {isLoading && (
        <div className="loading-overlay" aria-live="polite" aria-label="Loading">
          <div className="loading-overlay-panel">
            <span className="spinner loading-overlay-spinner" />
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider')
  }
  return context
}
