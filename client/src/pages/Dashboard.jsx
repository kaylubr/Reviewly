import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Plus, BookOpen, Zap, Flame, Clock, TrendingUp, ChevronRight, TreeDeciduous,
} from 'lucide-react'
import { insforge } from '../lib/insforge'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../lib/api'
import { calcLevel, getTreeStage, formatDate } from '../lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import XPBar from '../components/XPBar'
import ModuleCard from '../components/ModuleCard'

export default function Dashboard() {
  const { user, profile, token } = useAuth()
  const navigate = useNavigate()
  const [modules, setModules] = useState([])
  const [recentSessions, setRecentSessions] = useState([])
  const [weeklyXp, setWeeklyXp] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadDashboard() }, [user])

  async function loadDashboard() {
    setLoading(true)
    try {
      const [modsRes, sessRes, xpRes] = await Promise.all([
        insforge.database.from('modules').select('*')
          .eq('user_id', user.id).order('updated_at', { ascending: false }).limit(6),
        apiRequest('/api/sessions/history?limit=5', {}, token),
        apiRequest('/api/profile/weekly-xp', {}, token),
      ])
      setModules(modsRes.data || [])
      setRecentSessions(sessRes || [])
      setWeeklyXp(xpRes || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const lvlInfo = profile
    ? calcLevel(profile.xp || 0)
    : { level: 1, currentLevelXp: 0, nextLevelXp: 100, progress: 0 }
  const treeStage = getTreeStage(lvlInfo.level)

  return (
    <div className="page dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Good {greeting()}, {profile?.username || 'Learner'}</h1>
          <p className="subtitle">Keep growing — your tree is waiting.</p>
        </div>
        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/modules/create')}
        >
          <Plus size={17} /> New Module
        </motion.button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <StatCard icon={<Flame size={19} />} label="Day Streak" value={profile?.streak || 0} suffix="days" color="amber" />
        <StatCard icon={<Zap size={19} />} label="Total XP" value={profile?.xp || 0} color="violet" />
        <StatCard icon={<BookOpen size={19} />} label="Sessions" value={profile?.total_sessions || 0} color="emerald" />
        <StatCard icon={<Clock size={19} />} label="Study Time"
          value={Math.round((profile?.total_study_time_minutes || 0) / 60 * 10) / 10}
          suffix="hrs" color="sky" />
      </div>

      <div className="dashboard-grid">
        {/* Tree Card */}
        <motion.div
          className="card tree-summary-card"
          whileHover={{ y: -3 }}
          onClick={() => navigate('/tree')}
        >
          <div className="tree-card-content">
            <div style={{ flex: 1 }}>
              <p className="card-label">Knowledge Tree</p>
              <h2 className="tree-level">Level {lvlInfo.level}</h2>
              <p className="tree-stage-name">{treeStage.name}</p>
              <XPBar current={lvlInfo.currentLevelXp} max={lvlInfo.nextLevelXp} level={lvlInfo.level} />
            </div>
            <motion.div
              className="tree-preview"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
            >
              <TreeDeciduous size={36} strokeWidth={1.5} />
            </motion.div>
          </div>
          <div className="card-footer">
            View Progress <ChevronRight size={15} />
          </div>
        </motion.div>

        {/* Weekly XP chart */}
        <div className="card chart-card">
          <div className="card-header">
            <h3><TrendingUp size={17} /> Weekly XP</h3>
          </div>
          <ResponsiveContainer width="100%" height={145}>
            <AreaChart data={weeklyXp}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--lime)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--lime)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: '10px', fontSize: 12 }}
              />
              <Area type="monotone" dataKey="xp_earned" stroke="var(--lime-dark)" fill="url(#xpGrad)" strokeWidth={2.5} name="XP" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Modules */}
      <div className="section-header">
        <h2>Your Modules</h2>
        <button className="btn-ghost btn-sm" onClick={() => navigate('/modules/create')}>
          <Plus size={14} /> New
        </button>
      </div>

      {loading ? (
        <div className="modules-grid skeleton-grid">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton-card" />)}
        </div>
      ) : modules.length === 0 ? (
        <EmptyModules onAdd={() => navigate('/modules/create')} />
      ) : (
        <div className="modules-grid">
          {modules.map(mod => (
            <ModuleCard key={mod.id} module={mod} onStudy={() => navigate(`/modules/${mod.id}`)} />
          ))}
        </div>
      )}

      {/* Recent Sessions */}
      {recentSessions.length > 0 && (
        <>
          <div className="section-header">
            <h2>Recent Sessions</h2>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/analytics')}>View all</button>
          </div>
          <div className="sessions-list">
            {recentSessions.map(s => <SessionRow key={s.id} session={s} />)}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, suffix, color }) {
  return (
    <motion.div className={`stat-card stat-${color}`} whileHover={{ y: -2 }}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">
          {value}
          {suffix && <span className="stat-suffix"> {suffix}</span>}
        </p>
      </div>
    </motion.div>
  )
}

function SessionRow({ session }) {
  const modeColors = { flashcard: 'var(--lime-dark)', mcq: 'var(--violet)', speed: 'var(--amber)' }
  return (
    <div className="session-row">
      <span className="mode-badge" style={{ borderLeft: `3px solid ${modeColors[session.mode] || 'var(--border)'}`, paddingLeft: '0.5rem' }}>
        {session.mode}
      </span>
      <span className="session-module">{session.modules?.title || 'Unknown'}</span>
      <span className="session-score">{session.score}%</span>
      <span className="session-xp">+{session.xp_earned} XP</span>
      <span className="session-date">{formatDate(session.completed_at)}</span>
    </div>
  )
}

function EmptyModules({ onAdd }) {
  return (
    <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="empty-icon"><BookOpen size={28} strokeWidth={1.5} /></div>
      <h3>No modules yet</h3>
      <p>Upload your notes or create a module to get started</p>
      <button className="btn-primary" onClick={onAdd} style={{ marginTop: '0.5rem' }}>
        <Plus size={15} /> Create your first module
      </button>
    </motion.div>
  )
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}