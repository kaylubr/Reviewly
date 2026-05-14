import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ChevronRight } from 'lucide-react'

export default function FlashcardMode({ questions, onComplete }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [needReview, setNeedReview] = useState(0)
  const [startTime] = useState(Date.now())
  const [direction, setDirection] = useState(0)

  const card = questions[index]
  const total = questions.length
  const progress = index / total

  function handleKnow() {
    setKnown(k => k + 1)
    next(1)
  }

  function handleReview() {
    setNeedReview(n => n + 1)
    next(-1)
  }

  function next(dir) {
    setDirection(dir)
    setFlipped(false)
    if (index + 1 >= total) {
      const duration = Math.round((Date.now() - startTime) / 1000)
      onComplete({
        correct_answers: known + (dir > 0 ? 1 : 0),
        total_questions: total,
        duration_seconds: duration
      })
    } else {
      setTimeout(() => setIndex(i => i + 1), 150)
    }
  }

  return (
    <div className="flashcard-mode">
      {/* Progress bar */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="progress-text">{index + 1} / {total}</p>

      {/* Card */}
      <div className="flashcard-scene" onClick={() => setFlipped(f => !f)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index + (flipped ? '-back' : '-front')}
            className={`flashcard ${flipped ? 'back' : 'front'}`}
            initial={{ opacity: 0, rotateY: flipped ? -90 : 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: flipped ? 90 : -90 }}
            transition={{ duration: 0.3 }}
          >
            <div className="card-face-label">{flipped ? 'Answer' : 'Question'}</div>
            <p className="card-text">{flipped ? card.answer : card.question}</p>
            {!flipped && (
              <span className="flip-hint">Click to reveal answer</span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Difficulty badge */}
      <div className="difficulty-row">
        <DifficultyBadge level={card.difficulty} />
      </div>

      {/* Action buttons */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            className="flashcard-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="btn-need-review"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReview}
            >
              <X size={18} /> Need Review
            </motion.button>
            <motion.button
              className="btn-know-it"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleKnow}
            >
              <Check size={18} /> I Know This
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini stats */}
      <div className="flashcard-stats">
        <span className="stat-known">✓ {known}</span>
        <span className="stat-review">↩ {needReview}</span>
      </div>
    </div>
  )
}

function DifficultyBadge({ level }) {
  const labels = ['', 'Easy', 'Medium', 'Hard']
  const colors = ['', 'easy', 'medium', 'hard']
  return (
    <span className={`difficulty-badge diff-${colors[level]}`}>
      {labels[level]}
    </span>
  )
}
