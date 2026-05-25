import { motion } from 'framer-motion'
import { Trophy, Medal, Target, Zap, Star, RefreshCw, Home, RotateCcw } from 'lucide-react'
import { calcLevel } from '../../lib/utils'
import XPBar from '../XPBar'

const MODE_LABELS = {
  flashcard: 'Flashcard',
  mcq:       'Multiple Choice',
  speed:     'Speed Round',
}

function TrophyIcon({ score }) {
  if (score >= 90) return (
    <div className="complete-trophy-icon trophy-gold">
      <Trophy size={36} strokeWidth={1.8} />
    </div>
  )
  if (score >= 70) return (
    <div className="complete-trophy-icon trophy-silver">
      <Medal size={36} strokeWidth={1.8} />
    </div>
  )
  return (
    <div className="complete-trophy-icon trophy-target">
      <Target size={36} strokeWidth={1.8} />
    </div>
  )
}

export default function SessionComplete({ result, mode, onPlayAgain, onDashboard, onModules }) {
  const { xp_earned, new_xp, new_level, leveled_up, new_streak, score, new_achievements } = result
  const { currentLevelXp, nextLevelXp, progress } = calcLevel(new_xp || 0)

  const scoreColor =
    score >= 80 ? 'var(--lime)' : score >= 60 ? 'var(--amber)' : 'var(--crimson)'

  return (
    <motion.div
      className="session-complete"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, type: 'spring' }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <TrophyIcon score={score} />
      </motion.div>

      <h1 className="complete-title">
        {score >= 90 ? 'Outstanding!' : score >= 70 ? 'Great work!' : 'Keep going!'}
      </h1>
      <p className="complete-mode">{MODE_LABELS[mode] || mode}</p>

      {/* Score circle */}
      <div className="score-circle">
        <svg viewBox="0 0 120 120" className="score-svg">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="9" />
          <circle
            cx="60" cy="60" r="50" fill="none"
            stroke={scoreColor} strokeWidth="9"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="score-text">
          <span className="score-number">{score}%</span>
        </div>
      </div>

      {/* XP banner */}
      <motion.div
        className="xp-gained-banner"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Zap size={19} />
        <span>+{xp_earned} XP earned</span>
        {new_streak > 1 && (
          <span className="streak-pill">{new_streak} day streak</span>
        )}
      </motion.div>

      {/* Level up */}
      {leveled_up && (
        <motion.div
          className="levelup-banner"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <Star size={18} />
          <span>Level Up! You're now Level {new_level}</span>
        </motion.div>
      )}

      {/* Achievements */}
      {new_achievements?.length > 0 && (
        <motion.div
          className="achievements-earned"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3>Achievements Unlocked!</h3>
          <div className="achievements-list">
            {new_achievements.map(a => (
              <div key={a.id} className="achievement-pill">
                <span>{a.name}</span>
                <span className="ach-xp">+{a.xp_reward} XP</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* XP Bar */}
      {new_xp !== undefined && (
        <div className="complete-xpbar">
          <div className="xpbar-labels">
            <span>Level {new_level}</span>
            <span>{currentLevelXp} / {nextLevelXp} XP</span>
          </div>
          <XPBar current={currentLevelXp} max={nextLevelXp} level={new_level} />
        </div>
      )}

      {/* Actions */}
      <div className="complete-actions">
        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPlayAgain}
        >
          <RotateCcw size={15} /> Play Again
        </motion.button>
        <motion.button
          className="btn-secondary"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onModules}
        >
          <RefreshCw size={15} /> Change Mode
        </motion.button>
        <motion.button
          className="btn-ghost"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDashboard}
        >
          <Home size={15} /> Dashboard
        </motion.button>
      </div>
    </motion.div>
  )
}