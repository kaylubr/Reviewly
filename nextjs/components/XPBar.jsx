'use client'
import { motion } from 'framer-motion'

export default function XPBar({ current, max, level, large = false }) {
  const pct = Math.min((current / max) * 100, 100)

  return (
    <div className={`xpbar ${large ? 'xpbar-large' : ''}`}>
      <div className="xpbar-track">
        <motion.div
          className="xpbar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <motion.div
          className="xpbar-glow"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
