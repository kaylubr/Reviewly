'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, TreeDeciduous, BarChart2, User, LogOut, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { calcLevel } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/tree',      icon: TreeDeciduous,   label: 'Tree' },
  { to: '/analytics', icon: BarChart2,        label: 'Stats' },
  { to: '/profile',   icon: User,             label: 'Profile' },
]

export default function Navbar({ collapsed, onToggleCollapse }) {
  const { profile, signOut } = useAuth()
  const lvlInfo = calcLevel(profile?.xp || 0)
  const [showConfirm, setShowConfirm] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    router.push('/')
  }

  return (
    <>
      <nav className="sidebar">
        <Link href="/dashboard" className="sidebar-logo">
          <img src="/assets/reviewly-logo.png" alt="Reviewly" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">Reviewly</span>
        </Link>
        <button type="button" className="sidebar-collapse-btn" onClick={onToggleCollapse}>
          {collapsed ? <ChevronsRight size={18} strokeWidth={3} /> : <ChevronsLeft size={18} strokeWidth={3} />}
        </button>

        <div className="sidebar-links">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              href={item.to}
              className={`nav-link ${pathname === item.to ? 'active' : ''}`}
            >
              <item.icon size={17} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="sidebar-bottom">
          <Link href="/tree" className="sidebar-level-pill">
            <span className="sidebar-level-label">Level</span>
            <span className="sidebar-level-number">{lvlInfo.level}</span>
          </Link>
          <motion.button
            className="sidebar-logout-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowConfirm(true)}
          >
            <LogOut size={15} strokeWidth={2} />
            <span>Log out</span>
          </motion.button>
        </div>
      </nav>

      <AnimatePresence>
        {showConfirm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirm(false)}>
            <motion.div className="modal-dialog" initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}>
              <h2>Log out?</h2>
              <p>You'll need to sign back in to access your modules and progress.</p>
              <div className="modal-actions">
                <button className="btn-ghost no-icon" onClick={() => setShowConfirm(false)}>Cancel</button>
                <button className="btn-danger no-icon" onClick={handleLogout}>Log out</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
