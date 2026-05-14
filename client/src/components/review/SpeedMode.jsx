import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Check, X } from 'lucide-react'

const ROUND_TIME = 60

export default function SpeedMode({ questions, onComplete }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [combo, setCombo] = useState(1)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [xpEarned, setXpEarned] = useState(0)
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const startTime = useRef(Date.now())
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          finishRound()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  function finishRound() {
    if (!done) {
      setDone(true)
      onComplete({
        correct_answers: correct,
        total_questions: Math.max(index, 1),
        duration_seconds: ROUND_TIME - timeLeft
      })
    }
  }

  function handleSelect(i) {
    if (answered || done) return
    setSelected(i)
    setAnswered(true)

    const q = questions[index]
    const isRight = i === q.correct_index

    if (isRight) {
      const newStreak = streak + 1
      const newCombo = Math.min(Math.floor(newStreak / 3) + 1, 5)
      const xp = 20 * newCombo
      setCorrect(c => c + 1)
      setStreak(newStreak)
      setMaxStreak(m => Math.max(m, newStreak))
      setCombo(newCombo)
      setXpEarned(e => e + xp)
      setFeedback({ type: 'correct', xp, combo: newCombo })
    } else {
      setStreak(0)
      setCombo(1)
      setFeedback({ type: 'wrong' })
    }

    setTimeout(() => {
      setFeedback(null)
      setAnswered(false)
      setSelected(null)
      if (index + 1 >= questions.length) {
        clearInterval(timerRef.current)
        finishRound()
      } else {
        setIndex(idx => idx + 1)
      }
    }, 600)
  }

  const q = questions[index]
  const timerPct = (timeLeft / ROUND_TIME) * 100
  const timerColor = timerPct > 50 ? 'var(--emerald)' : timerPct > 25 ? 'var(--amber)' : 'var(--red)'
  const optionLetters = ['A', 'B', 'C', 'D']

  return (
    <div className="speed-mode">
      {/* Top HUD */}
      <div className="speed-hud">
        <div className="speed-timer" style={{ '--timer-color': timerColor }}>
          <svg viewBox="0 0 36 36" className="timer-svg">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={timerColor} strokeWidth="2"
              strokeDasharray={`${timerPct} 100`}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
            />
          </svg>
          <span className="timer-text">{timeLeft}</span>
        </div>
        <div className="speed-stats">
          <div className="speed-stat">
            <Zap size={14} />
            <span>{xpEarned} XP</span>
          </div>
          {combo > 1 && (
            <motion.div
              className="combo-badge"
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.2, 1] }}
              key={combo}
            >
              x{combo} COMBO
            </motion.div>
          )}
          {streak >= 3 && (
            <div className="streak-badge">🔥 {streak}</div>
          )}
        </div>
        <div className="speed-correct">{correct}/{questions.length}</div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="speed-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
        >
          <p className="speed-question">{q?.question}</p>
          <div className="speed-options">
            {(q?.options || []).map((opt, i) => {
              let state = 'idle'
              if (answered) {
                if (i === q.correct_index) state = 'correct'
                else if (i === selected) state = 'wrong'
                else state = 'dim'
              }
              return (
                <motion.button
                  key={i}
                  className={`speed-option option-${state}`}
                  onClick={() => handleSelect(i)}
                  whileHover={!answered ? { scale: 1.02 } : {}}
                  whileTap={!answered ? { scale: 0.97 } : {}}
                >
                  <span className="option-letter">{optionLetters[i]}</span>
                  {opt}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Feedback overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className={`speed-feedback feedback-${feedback.type}`}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.2 }}
          >
            {feedback.type === 'correct' ? (
              <>
                <Check size={24} />
                +{feedback.xp} XP
                {feedback.combo > 1 && <span className="combo-txt">×{feedback.combo}</span>}
              </>
            ) : (
              <X size={24} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
