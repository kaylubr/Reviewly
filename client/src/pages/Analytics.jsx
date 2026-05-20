import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../lib/api'
import { insforge } from '../lib/insforge'
import { calcLevel, formatDuration } from '../lib/utils'
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { BookOpen, Target, Zap, Clock, TrendingUp, Flame } from 'lucide-react'

export default function Analytics() {
  const { user, profile, token } = useAuth()
  const [weeklyXp, setWeeklyXp] = useState([])
  const [sessions, setSessions] = useState([])
  const [moduleStats, setModuleStats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) load() }, [user])

  async function load() {
    setLoading(true)
    try {
      const [xpRes, sessRes, modsRes] = await Promise.all([
        apiRequest('/api/profile/weekly-xp', {}, token),
        apiRequest('/api/sessions/history', {}, token),
        insforge.database.from('modules').select('title, mastery_score, total_sessions').eq('user_id', user.id).limit(8),
      ])
      setWeeklyXp(xpRes || [])
      setSessions(sessRes || [])
      setModuleStats(modsRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const modeCount = sessions.reduce((acc, s) => {
    acc[s.mode] = (acc[s.mode] || 0) + 1; return acc
  }, {})
  const modeData = [
    { name: 'Flashcard', value: modeCount.flashcard || 0, fill: 'var(--lime)' },
    { name: 'MCQ',       value: modeCount.mcq       || 0, fill: 'var(--violet)' },
    { name: 'Speed',     value: modeCount.speed     || 0, fill: 'var(--amber)' },
  ]
  const avgScore = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + r.score, 0) / sessions.length)
    : 0

  return (
    <div className="page analytics-page">
      <h1>Analytics</h1>
      <p className="subtitle">Track your learning journey and growth over time.</p>

      <div className="stats-row">
        <StatCard icon={<Zap size={18} />}      label="Total XP"    value={profile?.xp || 0}   color="violet" />
        <StatCard icon={<Flame size={18} />}    label="Best Streak" value={profile?.streak || 0} suffix="days" color="amber" />
        <StatCard icon={<Target size={18} />}   label="Avg Score"   value={`${avgScore}%`}      color="emerald" />
        <StatCard icon={<Clock size={18} />}    label="Study Time"
          value={`${Math.round((profile?.total_study_time_minutes || 0) / 60 * 10) / 10}h`} color="sky" />
      </div>

      <div className="analytics-grid">
        {/* Weekly XP */}
        <div className="card chart-card-lg">
          <div className="card-header">
            <h3><TrendingUp size={16} /> XP This Week</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyXp}>
              <defs>
                <linearGradient id="xpGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--lime)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--lime)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: '10px', fontSize: 12 }} />
              <Area type="monotone" dataKey="xp_earned" stroke="var(--lime-dark)" fill="url(#xpGrad2)" strokeWidth={2.5} name="XP" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Mode split */}
        <div className="card chart-card">
          <div className="card-header">
            <h3><BookOpen size={16} /> Session Modes</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={modeData} barSize={30}>
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: 'white', border: '1px solid var(--border)', borderRadius: '10px', fontSize: 12 }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Sessions">
                {modeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Module mastery */}
      {moduleStats.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3><Target size={16} /> Module Mastery</h3>
          </div>
          <div className="mastery-list">
            {moduleStats.map((mod, i) => (
              <motion.div key={mod.title} className="mastery-row"
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}>
                <span className="mastery-title">{mod.title}</span>
                <div className="mastery-bar-track">
                  <motion.div
                    className={`mastery-bar-fill mastery-${getMasteryColor(mod.mastery_score)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${mod.mastery_score}%` }}
                    transition={{ delay: i * 0.05 + 0.3, duration: 0.8 }}
                  />
                </div>
                <span className="mastery-pct">{mod.mastery_score}%</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Session history */}
      <div className="card">
        <div className="card-header">
          <h3><BookOpen size={16} /> Session History</h3>
        </div>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner" /></div>
        ) : sessions.length === 0 ? (
          <p className="empty-text">No sessions yet. Start reviewing!</p>
        ) : (
          <div className="session-table">
            <div className="session-table-header">
              <span>Mode</span><span>Module</span><span>Score</span>
              <span>XP</span><span>Duration</span><span>Date</span>
            </div>
            {sessions.map(s => (
              <div key={s.id} className="session-table-row">
                <span className="mode-badge">{s.mode}</span>
                <span className="session-module-name">{s.modules?.title || '—'}</span>
                <span className={`score-cell ${s.score >= 80 ? 'good' : s.score >= 60 ? 'ok' : 'low'}`}>{s.score}%</span>
                <span className="xp-cell">+{s.xp_earned}</span>
                <span>{formatDuration(s.duration_seconds)}</span>
                <span className="date-cell">{shortDate(s.completed_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, suffix, color }) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">{value}{suffix ? <span className="stat-suffix"> {suffix}</span> : ''}</p>
      </div>
    </div>
  )
}

function getMasteryColor(score) {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

function shortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}