import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { insforge } from '../lib/insforge'
import { calcLevel, getTreeStage } from '../lib/utils'
import { LogOut, User, Mail, Flame, Zap, BookOpen, Clock, TreeDeciduous } from 'lucide-react'
import XPBar from '../components/XPBar'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [saving, setSaving] = useState(false)

  const lvlInfo  = calcLevel(profile?.xp || 0)
  const treeStage = getTreeStage(lvlInfo.level)

  async function saveUsername() {
    if (!username.trim()) return
    setSaving(true)
    try {
      const { error } = await insforge.database
        .from('profiles').update({ username: username.trim() }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setEditing(false)
      toast.success('Username updated!')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="page profile-page">
      <h1>Profile</h1>

      {/* Avatar & name */}
      <div className="profile-hero">
        <div className="profile-avatar">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="avatar" />
          ) : (
            <div className="avatar-placeholder">
              {(profile?.username || user?.email || 'U')[0].toUpperCase()}
            </div>
          )}
          <div className="avatar-level">Lv.{lvlInfo.level}</div>
        </div>

        <div className="profile-info">
          {editing ? (
            <div className="edit-name-row">
              <input className="input" value={username}
                onChange={e => setUsername(e.target.value)} maxLength={40} />
              <button className="btn-primary btn-sm" onClick={saveUsername} disabled={saving}>
                {saving ? <span className="spinner" /> : 'Save'}
              </button>
              <button className="btn-ghost btn-sm"
                onClick={() => { setEditing(false); setUsername(profile?.username || '') }}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="name-row">
              <h2>{profile?.username || 'Learner'}</h2>
              <button className="edit-btn" onClick={() => setEditing(true)}>Edit</button>
            </div>
          )}
          <p className="profile-email"><Mail size={13} /> {user?.email}</p>
          <p className="profile-tree-stage">
            <TreeDeciduous size={13} style={{ display: 'inline', marginRight: 4 }} />
            {treeStage.name}
          </p>
        </div>
      </div>

      {/* XP card */}
      <div className="card profile-xp-card">
        <div className="xp-card-header">
          <h3>Level {lvlInfo.level}</h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {lvlInfo.currentLevelXp} / {lvlInfo.nextLevelXp} XP
          </span>
        </div>
        <XPBar current={lvlInfo.currentLevelXp} max={lvlInfo.nextLevelXp} level={lvlInfo.level} large />
        <p className="xp-hint" style={{ marginTop: '0.5rem' }}>
          {lvlInfo.nextLevelXp - lvlInfo.currentLevelXp} XP to level {lvlInfo.level + 1}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatCard icon={<Flame size={18} />}    label="Streak"   value={profile?.streak || 0} suffix="days" color="amber" />
        <StatCard icon={<Zap size={18} />}      label="Total XP" value={profile?.xp || 0}     color="violet" />
        <StatCard icon={<BookOpen size={18} />} label="Sessions" value={profile?.total_sessions || 0} color="emerald" />
        <StatCard icon={<Clock size={18} />}    label="Hours"
          value={Math.round((profile?.total_study_time_minutes || 0) / 60 * 10) / 10} color="sky" />
      </div>

      {/* Meta */}
      <div className="card profile-meta">
        <User size={13} />
        Member since {new Date(profile?.created_at || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>

      {/* Sign out */}
      <motion.button
        className="btn-danger"
        style={{ marginTop: '0.5rem' }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={signOut}
      >
        <LogOut size={15} /> Sign Out
      </motion.button>
    </div>
  )
}

function StatCard({ icon, label, value, suffix, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}{suffix && <span className="stat-suffix"> {suffix}</span>}</p>
      </div>
    </div>
  )
}