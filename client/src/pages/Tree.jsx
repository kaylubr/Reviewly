import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../lib/api'
import { calcLevel, getTreeStage } from '../lib/utils'
import XPBar from '../components/XPBar'

const TREE_STAGES = [
  {
    level: [1, 4],
    emoji: '🌱',
    name: 'Tiny Sapling',
    desc: 'Your journey begins. A small seed of knowledge in a humble pot.',
    bg: 'from-green-50 to-emerald-100',
    particles: ['✨'],
    env: '🪴'
  },
  {
    level: [5, 9],
    emoji: '🪴',
    name: 'Young Tree',
    desc: 'Roots are strengthening. A curious young tree reaching for the sun.',
    bg: 'from-emerald-100 to-green-200',
    particles: ['🍃', '✨'],
    env: '🌿🪴🌿'
  },
  {
    level: [10, 14],
    emoji: '🌳',
    name: 'Leafy Tree',
    desc: 'Full of leaves, standing proud. Knowledge is flowing through every branch.',
    bg: 'from-green-200 to-teal-200',
    particles: ['🍃', '🐦', '✨'],
    env: '🌿🌳🌿'
  },
  {
    level: [15, 19],
    emoji: '🌸',
    name: 'Blooming Tree',
    desc: 'Flowers bloom — a sign of mastery and growth. Others look up in wonder.',
    bg: 'from-teal-200 to-pink-100',
    particles: ['🌸', '🦋', '✨', '🐦'],
    env: '🌺🌸🌺'
  },
  {
    level: [20, Infinity],
    emoji: '🌳✨',
    name: 'Mystical Ancient Tree',
    desc: 'A magical force of nature. Fireflies dance, wisdom radiates — you are the forest.',
    bg: 'from-purple-100 to-indigo-200',
    particles: ['✨', '🌟', '🦋', '🌸', '🔮'],
    env: '🌟🌳✨🌟'
  }
]

function getStageData(level) {
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
  const stage = getStageData(lvlInfo.level)
  const xpToNextLevel = lvlInfo.nextLevelXp - lvlInfo.currentLevelXp
  const nextStageLevel = TREE_STAGES.find(s => s.level[0] > lvlInfo.level)?.level[0]

  return (
    <div className="page tree-page">
      <h1>Your Knowledge Tree</h1>
      <p className="subtitle">Each session grows your tree. Keep learning, keep blooming.</p>

      {/* Main tree visualization */}
      <div className="tree-arena">
        <div className="tree-bg-glow" />

        {/* Floating particles */}
        <div className="tree-particles-container">
          {stage.particles.flatMap((p, pi) =>
            [...Array(3)].map((_, j) => (
              <motion.span
                key={`${pi}-${j}`}
                className="tree-particle"
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{
                  opacity: [0, 0.8, 0],
                  y: -(60 + Math.random() * 80),
                  x: (Math.random() - 0.5) * 120
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5 + Math.random() * 2,
                  delay: (pi * 3 + j) * 0.4
                }}
                style={{
                  position: 'absolute',
                  bottom: '20%',
                  left: `${30 + Math.random() * 40}%`,
                  fontSize: '1.2rem'
                }}
              >
                {p}
              </motion.span>
            ))
          )}
        </div>

        {/* The Tree */}
        <motion.div
          className="main-tree"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          <span className="tree-main-emoji">{stage.emoji.split('').join('')}</span>
        </motion.div>

        {/* Environment */}
        <div className="tree-environment">{stage.env}</div>
      </div>

      {/* Stage info */}
      <motion.div
        className="stage-info"
        key={lvlInfo.level}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="stage-name-row">
          <h2>{stage.name}</h2>
          <span className="level-badge">Level {lvlInfo.level}</span>
        </div>
        <p className="stage-desc">{stage.desc}</p>
        <XPBar current={lvlInfo.currentLevelXp} max={lvlInfo.nextLevelXp} level={lvlInfo.level} large />
        <p className="xp-hint">{xpToNextLevel} XP to level {lvlInfo.level + 1}</p>
        {nextStageLevel && (
          <p className="next-stage-hint">
            🌿 Reach Level {nextStageLevel} to unlock the next tree form!
          </p>
        )}
      </motion.div>

      {/* Evolution timeline */}
      <div className="evolution-section">
        <h2>Evolution Path</h2>
        <div className="evolution-timeline">
          {TREE_STAGES.map((s, i) => {
            const unlocked = lvlInfo.level >= s.level[0]
            const current = lvlInfo.level >= s.level[0] && lvlInfo.level <= s.level[1]
            return (
              <motion.div
                key={i}
                className={`evolution-step ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''}`}
                whileHover={unlocked ? { scale: 1.05 } : {}}
              >
                <div className="evo-emoji">
                  {unlocked ? s.emoji : '🔒'}
                </div>
                <p className="evo-name">{s.name}</p>
                <p className="evo-level">Level {s.level[0]}+</p>
                {current && <span className="evo-current-badge">Current</span>}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="achievements-section">
        <h2>Achievements</h2>
        {loading ? (
          <div className="ach-loading"><span className="spinner" /></div>
        ) : (
          <div className="achievements-grid">
            {achievements.all.map(ach => {
              const earned = achievements.earned_ids.includes(ach.id)
              return (
                <motion.div
                  key={ach.id}
                  className={`achievement-card ${earned ? 'earned' : 'locked'}`}
                  whileHover={{ scale: 1.04 }}
                >
                  <span className="ach-icon">{ach.icon}</span>
                  <p className="ach-name">{ach.name}</p>
                  <p className="ach-desc">{ach.description}</p>
                  <span className="ach-xp">+{ach.xp_reward} XP</span>
                  {earned && <span className="ach-check">✓</span>}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


