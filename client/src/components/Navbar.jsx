import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, TreeDeciduous, BarChart2, User, Plus, Leaf } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { calcLevel } from '../lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/tree',      icon: TreeDeciduous,   label: 'Tree' },
  { to: '/analytics', icon: BarChart2,        label: 'Stats' },
  { to: '/profile',   icon: User,             label: 'Profile' },
]

export default function Navbar() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const lvlInfo = calcLevel(profile?.xp || 0)

  return (
    <nav className="navbar">
      {/* Logo */}
      <NavLink to="/dashboard" className="navbar-logo">
        <div className="logo-icon">
          <Leaf size={18} strokeWidth={2.5} />
        </div>
        <span className="logo-text">Reviewly</span>
      </NavLink>

      {/* Nav links */}
      <div className="navbar-links">
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

      {/* Right: level + new module */}
      <div className="navbar-right">
        <motion.button
          className="btn-primary btn-sm navbar-new-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/modules/create')}
        >
          <Plus size={15} strokeWidth={2.5} /> New
        </motion.button>

        <NavLink to="/tree" className="level-pill">
          <span>Lv.{lvlInfo.level}</span>
        </NavLink>
      </div>
    </nav>
  )
}