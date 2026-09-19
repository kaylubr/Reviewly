import { AnimatePresence, motion } from 'framer-motion';
import { BarChart2, ChevronsLeft, ChevronsRight, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useSignOut } from '../lib/auth';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/analytics', icon: BarChart2, label: 'Stats' },
  { to: '/profile', icon: User, label: 'Profile' },
];

type NavbarProps = {
  collapsed: boolean;
  onToggleCollapse: () => void;
};

export function Navbar({ collapsed, onToggleCollapse }: NavbarProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const signOut = useSignOut();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut.mutateAsync();
    setShowConfirm(false);
    navigate('/');
  }

  return (
    <>
      <nav className="sidebar">
        <NavLink to="/dashboard" className="sidebar-logo">
          <img src="/assets/reviewly-logo.png" alt="Reviewly" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">Reviewly</span>
        </NavLink>
        <button type="button" className="sidebar-collapse-btn" onClick={onToggleCollapse}>
          {collapsed ? <ChevronsRight size={18} strokeWidth={3} /> : <ChevronsLeft size={18} strokeWidth={3} />}
        </button>

        <div className="sidebar-links">
          {NAV_ITEMS.map((item) => (
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
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Log out?</h2>
              <p>You&apos;ll need to sign back in to access your modules and progress.</p>
              <div className="modal-actions">
                <button className="btn-ghost no-icon" onClick={() => setShowConfirm(false)}>
                  Cancel
                </button>
                <button className="btn-danger no-icon" onClick={handleLogout}>
                  Log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
