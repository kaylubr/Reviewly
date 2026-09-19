import type { ReviewMode } from '@reviewly/shared';
import { motion } from 'framer-motion';
import { Home, Medal, RefreshCw, RotateCcw, Target, Trophy } from 'lucide-react';
import type { ReviewOutcome } from '../../lib/review';

const MODE_LABELS: Record<ReviewMode, string> = {
  flashcard: 'Flashcard',
  mcq: 'Multiple Choice',
  speed: 'Speed Round',
};

type SessionCompleteProps = {
  outcome: ReviewOutcome;
  mode: ReviewMode;
  onPlayAgain: () => void;
  onDashboard: () => void;
  onModules: () => void;
};

function TrophyIcon({ score }: { score: number }) {
  if (score >= 90) {
    return (
      <div className="complete-trophy-icon trophy-gold">
        <Trophy size={36} strokeWidth={1.8} />
      </div>
    );
  }

  if (score >= 70) {
    return (
      <div className="complete-trophy-icon trophy-silver">
        <Medal size={36} strokeWidth={1.8} />
      </div>
    );
  }

  return (
    <div className="complete-trophy-icon trophy-target">
      <Target size={36} strokeWidth={1.8} />
    </div>
  );
}

export function SessionComplete({
  outcome,
  mode,
  onPlayAgain,
  onDashboard,
  onModules,
}: SessionCompleteProps) {
  const { score } = outcome;
  const scoreColor = score >= 80 ? 'var(--lime)' : score >= 60 ? 'var(--amber)' : 'var(--crimson)';

  return (
    <motion.div
      className="session-complete"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, type: 'spring' }}
    >
      <div>
        <TrophyIcon score={score} />
      </div>

      <h1 className="complete-title">
        {score >= 90 ? 'Outstanding!' : score >= 70 ? 'Great work!' : 'Keep going!'}
      </h1>
      <p className="complete-mode">{MODE_LABELS[mode] ?? mode}</p>

      <div className="score-circle">
        <svg viewBox="0 0 120 120" className="score-svg">
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="9" />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke={scoreColor}
            strokeWidth="9"
            strokeDasharray={`${(score / 100) * 314} 314`}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div className="score-text">
          <span className="score-number">{score}%</span>
        </div>
      </div>

      <motion.div
        className="complete-summary"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {outcome.saved ? (
          <>
            <span>
              {outcome.moduleTotalSessions} session
              {outcome.moduleTotalSessions === 1 ? '' : 's'} on this module
            </span>
            <span>{outcome.masteryScore}% mastery</span>
          </>
        ) : (
          <span>This session could not be saved, so your progress was not recorded.</span>
        )}
      </motion.div>

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
  );
}
