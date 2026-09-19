'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function TokenExpirationAlert({ isVisible, onDismiss, onLogout }) {
  useEffect(() => {
    if (isVisible) {
      // Auto sign out after showing the message for 30 seconds
      const timeout = setTimeout(() => {
        onLogout()
      }, 30000)
      return () => clearTimeout(timeout)
    }
  }, [isVisible, onLogout])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="token-expiration-alert"
        >
          <div className="token-expiration-content">
            <div className="token-expiration-message">
              <span className="token-expiration-icon">⚠️</span>
              <div>
                <p className="token-expiration-title">Session Expired</p>
                <p className="token-expiration-description">
                  Your authentication session has expired. You'll be logged out in 30 seconds.
                </p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="token-expiration-close"
              aria-label="Dismiss alert"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
