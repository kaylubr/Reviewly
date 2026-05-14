import { motion } from 'framer-motion'
import { Trophy, Zap, Star, RefreshCw, Home, RotateCcw } from 'lucide-react'
import { calcLevel } from '../../lib/utils'

export default function SessionComplete({ result, mode, onPlayAgain, onDashboard, onModules }) {
  const { xp_earned, new_xp, new_level, leveled_up, new_streak, score, new_achievements } = result
  const { currentLevelXp, nextLevelXp, progress } = calcLevel(new_xp || 0)

  const modeLabel = { flashcard: '🃏 Flashcard', mcq: '🎯 Multiple Choice', speed: '⚡ Speed Round' }[mode]

  return (
    <motion.div
      className="session-complete"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: 'spring' }}
    >
      {/* Trophy animation */}
      <motion.div
        className="complete-trophy"
        animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        {score >= 90 ? '🏆' : score >= 70 ? '🥈' : '🎯'}
      </motion.div>

      <h1 className="complete-title">
        {score >= 90 ? 'Outstanding!' : score >= 70 ? 'Great work!' : 'Keep practicing!'}
      </h1>
      <p className="complete-mode">{modeLabel}</p>

      {/* Score circle */}
      <div className="score-circle">
        <svg viewBox="0 0 120 120" className="score-svg">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke={score >= 80 ? 'var(--emerald)' : score >= 60 ? 'var(--amber)' : 'var(--red)'}
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="score-text">
          <span className="score-number">{score}%</span>
        </div>
      </div>

      {/* XP gained */}
      <motion.div
        className="xp-gained-banner"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Zap size={20} />
        <span>+{xp_earned} XP earned</span>
        {new_streak > 1 && <span className="streak-pill">🔥 {new_streak} day streak</span>}
      </motion.div>

      {/* Level up */}
      {leveled_up && (
        <motion.div
          className="levelup-banner"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <Star size={20} />
          <span>Level Up! You're now Level {new_level} 🌳</span>
        </motion.div>
      )}

      {/* New achievements */}
      {new_achievements?.length > 0 && (
        <motion.div
          className="achievements-earned"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3>Achievements Unlocked!</h3>
          <div className="achievements-list">
            {new_achievements.map(a => (
              <div key={a.id} className="achievement-pill">
                <span>{a.icon}</span>
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
          <div className="xpbar-track">
            <motion.div
              className="xpbar-fill"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ delay: 0.4, duration: 1, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="complete-actions">
        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPlayAgain}
        >
          <RotateCcw size={16} /> Play Again
        </motion.button>
        <motion.button
          className="btn-secondary"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onModules}
        >
          <RefreshCw size={16} /> Change Mode
        </motion.button>
        <motion.button
          className="btn-ghost"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onDashboard}
        >
          <Home size={16} /> Dashboard
        </motion.button>
      </div>
    </motion.div>
  )
}
