import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, TreeDeciduous, BarChart2, User, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { calcLevel } from '../lib/utils'

import logo from '../assets/reviewly-logo.png'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/tree',      icon: TreeDeciduous,   label: 'Tree' },
  { to: '/analytics', icon: BarChart2,        label: 'Stats' },
  { to: '/profile',   icon: User,             label: 'Profile' },
]

export default function Navbar() {
  const { profile, signOut } = useAuth()
  const lvlInfo = calcLevel(profile?.xp || 0)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleLogout() {
    await signOut()
    window.location.replace('/')
  }

  return (
    <>
      <nav className="sidebar">
        <NavLink to="/dashboard" className="sidebar-logo">
          <img src={logo} alt="Reviewly" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">Reviewly</span>
        </NavLink>

        <div className="sidebar-links">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon size={17} strokeWidth={2} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-bottom">
          <NavLink to="/tree" className="sidebar-level-pill">
            <span className="sidebar-level-label">Level</span>
            <span className="sidebar-level-number">{lvlInfo.level}</span>
          </NavLink>

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
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="modal-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
            >
              <h2>Log out?</h2>
              <p>You'll need to sign back in to access your modules and progress.</p>
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button className="btn-danger" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}