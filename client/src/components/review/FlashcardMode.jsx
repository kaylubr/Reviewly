import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, RotateCcw } from 'lucide-react'

export default function FlashcardMode({ questions, onComplete }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [needReview, setNeedReview] = useState(0)
  const [startTime] = useState(Date.now())
  const [completed, setCompleted] = useState(false)

  const card = questions[index]
  const total = questions.length
  const progress = index / total

  function handleKnow() {
    if (completed) return
    const next = known + 1
    setKnown(next)
    advance(1, next)
  }

  function handleReview() {
    if (completed) return
    setNeedReview(n => n + 1)
    advance(-1, known)
  }

  function advance(dir, knownCount) {
    setFlipped(false)
    if (index + 1 >= total) {
      setCompleted(true)
      onComplete({
        correct_answers: knownCount,
        total_questions: total,
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
      })
    } else {
      setTimeout(() => setIndex(i => i + 1), 160)
    }
  }

  return (
    <div className="flashcard-mode">
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="progress-text">{index + 1} / {total}</p>

      <div className="flashcard-scene" onClick={() => setFlipped(f => !f)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={index + (flipped ? '-b' : '-f')}
            className={`flashcard ${flipped ? 'back' : 'front'}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22 }}
          >
            <div className="card-face-label">{flipped ? 'Answer' : 'Question'}</div>
            <p className="card-text">{flipped ? card.answer : card.question}</p>
            {!flipped && (
              <span className="flip-hint">
                <RotateCcw size={13} style={{ display: 'inline', marginRight: 4 }} />
                Click to reveal answer
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="difficulty-row">
        <DifficultyBadge level={card.difficulty} />
      </div>

      <AnimatePresence>
        {flipped && (
          <motion.div
            className="flashcard-actions"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <motion.button
              className="btn-need-review"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleReview}
            >
              <X size={17} /> Need Review
            </motion.button>
            <motion.button
              className="btn-know-it"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleKnow}
            >
              <Check size={17} /> I Know This
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flashcard-stats">
        <span className="stat-known">
          <Check size={14} style={{ display: 'inline', marginRight: 4 }} />
          {known} known
        </span>
        <span className="stat-review">
          <X size={14} style={{ display: 'inline', marginRight: 4 }} />
          {needReview} review
        </span>
      </div>
    </div>
  )
}

function DifficultyBadge({ level }) {
  const labels = ['', 'Easy', 'Medium', 'Hard']
  const colors = ['', 'easy', 'medium', 'hard']
  if (!level) return null
  return (
    <span className={`difficulty-badge diff-${colors[level]}`}>
      {labels[level]}
    </span>
  )
}