'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { apiRequest } from '@/lib/api'
import { calcLevel } from '@/lib/utils'
import { Star, Lock, Check } from 'lucide-react'
import XPBar from '@/components/XPBar'
import { TreeStage1, TreeStage2, TreeStage3, TreeStage4, TreeStage5 } from '@/components/TreeIllustrations'

const TREE_STAGES = [
  { level: [1,  4],        Component: TreeStage1, name: 'Tiny Sapling',          desc: 'Your journey begins. A small seed of knowledge taking root.' },
  { level: [5,  9],        Component: TreeStage2, name: 'Young Tree',             desc: 'Roots strengthening. A curious young tree reaching for light.' },
  { level: [10, 14],       Component: TreeStage3, name: 'Leafy Tree',             desc: 'Full of leaves, standing proud. Knowledge flowing through every branch.' },
  { level: [15, 19],       Component: TreeStage4, name: 'Blooming Tree',          desc: 'Flowers bloom — a sign of mastery. Others look up in wonder.' },
  { level: [20, Infinity], Component: TreeStage5, name: 'Mystical Ancient Tree',  desc: 'A force of nature. Wisdom radiates — you are the forest.' },
]
function getStage(level) {
  return TREE_STAGES.find(s => level >= s.level[0] && level <= s.level[1]) || TREE_STAGES[0]
}

export default function Tree() {
  const { profile, token } = useAuth()
  const [achievements, setAchievements] = useState({ all: [], earned_ids: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      apiRequest('/api/profile/achievements', {}, token)
        .then(data => setAchievements(data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [token])

  const lvlInfo = calcLevel(profile?.xp || 0)
  const stage = getStage(lvlInfo.level)
  const xpToNext = lvlInfo.nextLevelXp - lvlInfo.currentLevelXp
  const nextStageLevel = TREE_STAGES.find(s => s.level[0] > lvlInfo.level)?.level[0]

  return (
    <div className="page tree-page">
      <h1>Your Knowledge Tree</h1>
      <p className="subtitle">Each session grows your tree. Keep learning, keep blooming.</p>

      <div className="tree-arena">
        <div className="tree-bg-glow" />
        <div className="tree-particles-container">
          {[...Array(6)].map((_, i) => (
            <motion.div key={i} className="tree-particle"
              style={{ position: 'absolute', bottom: '25%', left: `${20 + i * 12}%` }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.7, 0], y: -60 - Math.random() * 40 }}
              transition={{ repeat: Infinity, duration: 2.5 + i * 0.4, delay: i * 0.5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)' }} />
            </motion.div>
          ))}
        </div>
        <motion.div className="main-tree" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}>
          <div className="tree-main-icon"><stage.Component width={220} height={220} /></div>
        </motion.div>
        <div className="tree-environment">
          {[...Array(5)].map((_, i) => <div key={i} className="tree-env-dot" style={{ opacity: 0.3 + i * 0.12 }} />)}
        </div>
      </div>

      <motion.div className="stage-info" key={lvlInfo.level} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="stage-name-row">
          <h2>{stage.name}</h2>
          <span className="level-badge">Level {lvlInfo.level}</span>
        </div>
        <p className="stage-desc">{stage.desc}</p>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <XPBar current={lvlInfo.currentLevelXp} max={lvlInfo.nextLevelXp} level={lvlInfo.level} large />
        </div>
        <p className="xp-hint">{xpToNext} XP to level {lvlInfo.level + 1}</p>
        {nextStageLevel && <p className="next-stage-hint">Reach Level {nextStageLevel} to unlock the next tree form</p>}
      </motion.div>

      <div className="evolution-section">
        <h2>Evolution Path</h2>
        <div className="evolution-timeline">
          {TREE_STAGES.map((s, i) => {
            const unlocked = lvlInfo.level >= s.level[0]
            const current = lvlInfo.level >= s.level[0] && lvlInfo.level <= s.level[1]
            return (
              <motion.div key={i} className={`evolution-step ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}`} whileHover={unlocked ? { scale: 1.04 } : {}}>
                {current && <span className="evo-current-badge">Current</span>}
                <div className="evo-icon">
                  {unlocked ? <s.Component width={36} height={36} /> : <Lock size={18} strokeWidth={1.8} />}
                </div>
                <p className="evo-name">{s.name}</p>
                <p className="evo-level">Level {s.level[0]}+</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="achievements-section">
        <h2>Achievements</h2>
        {loading ? (
          <div className="ach-loading"><span className="spinner-lg" /></div>
        ) : (
          <div className="achievements-grid">
            {achievements.all.map(ach => {
              const earned = achievements.earned_ids.includes(ach.id)
              return (
                <motion.div key={ach.id} className={`achievement-card ${earned ? 'earned' : 'locked'}`} whileHover={{ scale: 1.03 }}>
                  <div className="ach-icon"><Star size={20} strokeWidth={1.8} /></div>
                  <p className="ach-name">{ach.name}</p>
                  <p className="ach-desc">{ach.description}</p>
                  <span className="ach-xp">+{ach.xp_reward} XP</span>
                  {earned && <div className="ach-check"><Check size={12} strokeWidth={3} /></div>}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
