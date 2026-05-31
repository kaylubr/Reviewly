import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { apiRequest } from '../lib/api'
import { calcLevel } from '../lib/utils'
import { Lock, Check, Star } from 'lucide-react'
import XPBar from '../components/XPBar'
import {
  TreeStage1,  TreeStage2,  TreeStage3,  TreeStage4,
  TreeStage5,  TreeStage6,  TreeStage7,  TreeStage8,
  TreeStage9,  TreeStage10, TreeStage11, TreeStage12,
} from '../components/TreeIllustrations'

const TREE_STAGES = [
  { level: [1,   4],   Component: TreeStage1,  name: 'Tiny Sapling',       desc: 'Your journey begins. A small seed of knowledge taking root.' },
  { level: [5,   9],   Component: TreeStage2,  name: 'Young Tree',          desc: 'Roots strengthening. A curious young tree reaching for light.' },
  { level: [10,  14],  Component: TreeStage3,  name: 'Leafy Tree',          desc: 'Full of leaves, standing proud. Knowledge flows through every branch.' },
  { level: [15,  19],  Component: TreeStage4,  name: 'Blooming Tree',       desc: 'Flowers bloom — a sign of mastery. Others look up in wonder.' },
  { level: [20,  29],  Component: TreeStage5,  name: 'Majestic Tree',       desc: 'Wide and proud, this tree commands respect. You are growing fast.' },
  { level: [30,  39],  Component: TreeStage6,  name: 'Ancient Tree',        desc: 'Gnarled and wise, with bark etched by years of knowledge gained.' },
  { level: [40,  49],  Component: TreeStage7,  name: 'Elder Tree',          desc: 'A double-tiered canopy — two layers of mastery reaching skyward.' },
  { level: [50,  59],  Component: TreeStage8,  name: 'Giant Tree',          desc: 'Massive roots, enormous spread. You are half-way to legend.' },
  { level: [60,  74],  Component: TreeStage9,  name: 'Mythic Tree',         desc: 'An inner light shines. Mythology is built around trees like this.' },
  { level: [75,  84],  Component: TreeStage10, name: 'Legendary Tree',      desc: 'Four tiers of branches, roots that hold mountains. True mastery.' },
  { level: [85,  99],  Component: TreeStage11, name: 'Cosmic Tree',         desc: 'Stars orbit your canopy. The cosmos acknowledges your knowledge.' },
  { level: [100, 100], Component: TreeStage12, name: 'Maxed',               desc: 'The World Tree. You have reached the pinnacle. You are the forest, the roots, and the sky.' },
]

function getStage(level) {
  return (
    TREE_STAGES.find(s => level >= s.level[0] && level <= s.level[1]) ||
    TREE_STAGES[TREE_STAGES.length - 1]
  )
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

  const lvlInfo       = calcLevel(profile?.xp || 0)
  const stage         = getStage(lvlInfo.level)
  const isMaxed       = lvlInfo.level >= 100
  const xpToNext      = lvlInfo.nextLevelXp - lvlInfo.currentLevelXp
  const nextStageLevel = TREE_STAGES.find(s => s.level[0] > lvlInfo.level)?.level[0]

  return (
    <div className="page tree-page">
      <h1>Your Knowledge Tree</h1>
      <p className="subtitle">Each session grows your tree. Keep learning, keep blooming.</p>

      {/* Tree arena */}
      <div className="tree-arena">
        <div className="tree-bg-glow" />

        {/* Floating lime particles */}
        <div className="tree-particles-container">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              style={{ position: 'absolute', bottom: '18%', left: `${16 + i * 12}%` }}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 0.65, 0], y: -(50 + i * 9) }}
              transition={{ repeat: Infinity, duration: 2.6 + i * 0.35, delay: i * 0.55 }}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--lime)' }} />
            </motion.div>
          ))}
        </div>

        {/* Tree illustration */}
        <motion.div
          className="main-tree"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
        >
          <div className="tree-main-icon">
            <stage.Component />
          </div>
        </motion.div>

        {/* Ground dots */}
        <div className="tree-environment">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="tree-env-dot" style={{ opacity: 0.25 + i * 0.1 }} />
          ))}
        </div>
      </div>

      {/* Stage info */}
      <motion.div
        className="stage-info"
        key={lvlInfo.level}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="stage-name-row">
          <h2>{stage.name}</h2>
          <span className={`level-badge ${isMaxed ? 'level-badge-maxed' : ''}`}>
            {isMaxed ? 'MAXED' : `Level ${lvlInfo.level}`}
          </span>
        </div>
        <p className="stage-desc">{stage.desc}</p>

        {isMaxed ? (
          <p className="maxed-label">You have reached the pinnacle of knowledge.</p>
        ) : (
          <>
            <div style={{ width: '100%', maxWidth: 360 }}>
              <XPBar current={lvlInfo.currentLevelXp} max={lvlInfo.nextLevelXp} level={lvlInfo.level} large />
            </div>
            <p className="xp-hint">{xpToNext.toLocaleString()} XP to level {lvlInfo.level + 1}</p>
            {nextStageLevel && (
              <p className="next-stage-hint">
                Reach Level {nextStageLevel} to unlock the next tree form
              </p>
            )}
          </>
        )}
      </motion.div>

      {/* Evolution path */}
      <div className="evolution-section">
        <h2>Evolution Path</h2>
        <div className="evolution-timeline">
          {TREE_STAGES.map((s, i) => {
            const unlocked = lvlInfo.level >= s.level[0]
            const current  = lvlInfo.level >= s.level[0] && lvlInfo.level <= s.level[1]
            const isWorldTree = s.level[0] === 100
            return (
              <div
                key={i}
                className={`evolution-step ${unlocked ? 'unlocked' : 'locked'} ${current ? 'current' : ''} ${isWorldTree ? 'world-tree-step' : ''}`}
              >
                {current && <span className="evo-current-badge">Current</span>}

                <div className="evo-icon">
                  {unlocked
                    ? <s.Component width={36} height={36} />
                    : <Lock size={18} strokeWidth={1.8} />}
                </div>

                <p className="evo-name">{s.name}</p>
                <p className="evo-level">
                  {s.level[0] === 100 ? 'Level 100' : `Level ${s.level[0]}+`}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="achievements-section">
        <h2>Achievements</h2>
        {loading ? (
          <div className="ach-loading"><span className="spinner-lg" /></div>
        ) : (
          <div className="achievements-grid">
            {achievements.all.map(ach => {
              const earned = achievements.earned_ids.includes(ach.id)
              return (
                <motion.div
                  key={ach.id}
                  className={`achievement-card ${earned ? 'earned' : 'locked'}`}
                  whileHover={{ scale: 1.03 }}
                >
                  <div className="ach-icon">
                    <Star size={20} strokeWidth={1.8} />
                  </div>
                  <p className="ach-name">{ach.name}</p>
                  <p className="ach-desc">{ach.description}</p>
                  <span className="ach-xp">+{ach.xp_reward} XP</span>
                  {earned && (
                    <div className="ach-check"><Check size={12} strokeWidth={3} /></div>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}