import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
  const navigate = useNavigate()
  const lvlInfo = calcLevel(profile?.xp || 0)

  async function handleLogout() {
    await signOut()
    navigate('/')
  }

  return (
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
          onClick={handleLogout}
        >
          <LogOut size={15} strokeWidth={2} />
          <span>Log out</span>
        </motion.button>
      </div>
    </nav>
  )
}