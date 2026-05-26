import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Check, X } from 'lucide-react'

import bgIcon from '../../assets/mcq/mcq-question-bg-icon.png'

const ROUND_TIME = 60

export default function SpeedMode({ questions, onComplete }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [combo, setCombo] = useState(1)
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME)
  const [xpEarned, setXpEarned] = useState(0)
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const timerRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); finishRound(); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  function finishRound() {
    if (doneRef.current) return
    doneRef.current = true
    setDone(true)
    onComplete({
      correct_answers: correct,
      total_questions: Math.max(index, 1),
      duration_seconds: ROUND_TIME - timeLeft,
    })
  }

  function handleSelect(i) {
    if (answered || done) return
    setSelected(i)
    setAnswered(true)
    const q = questions[index]
    const isRight = i === q.correct_index

    if (isRight) {
      const ns = streak + 1
      const nc = Math.min(Math.floor(ns / 3) + 1, 5)
      const xp = 20 * nc
      setCorrect(c => c + 1)
      setStreak(ns)
      setCombo(nc)
      setXpEarned(e => e + xp)
      setFeedback({ type: 'correct', xp, combo: nc })
    } else {
      setStreak(0); setCombo(1)
      setFeedback({ type: 'wrong' })
    }

    setTimeout(() => {
      setFeedback(null); setAnswered(false); setSelected(null)
      if (index + 1 >= questions.length) { clearInterval(timerRef.current); finishRound() }
      else setIndex(idx => idx + 1)
    }, 600)
  }

  const q = questions[index]
  const timerPct = (timeLeft / ROUND_TIME) * 100
  const optionLetters = ['A', 'B', 'C', 'D']

  function getOptionState(i) {
    if (!answered) return 'idle'
    if (i === q.correct_index) return 'correct'
    if (i === selected) return 'wrong'
    return 'dim'
  }

  return (
    <div className="mcq-wrapper">
      {/* Timer bar */}
      <div className="speed-timer-bar">
        <motion.div
          className="speed-timer-fill"
          animate={{ width: `${timerPct}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* HUD */}
      <p className="mcq-progress-text">
        {timeLeft}s &nbsp;·&nbsp; {correct} correct &nbsp;·&nbsp; {xpEarned} XP
        {combo > 1 && <span className="speed-combo-inline"> ×{combo} COMBO</span>}
        {streak >= 3 && <span className="speed-streak-inline"> 🔥{streak}</span>}
      </p>

      {/* Question area */}
      <div className="mcq-question-area">
        <img src={bgIcon} className="mcq-question-bg-icon" alt="" aria-hidden="true" />
        <AnimatePresence mode="wait">
          <motion.p
            key={`q-${index}`}
            className="mcq-question"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {q?.question}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Options */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`opts-${index}`}
          className="mcq-options"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {(q?.options || []).map((opt, i) => {
            const state = getOptionState(i)
            return (
              <motion.button
                key={i}
                className={`mcq-option option-${state}`}
                onClick={() => handleSelect(i)}
                whileHover={!answered ? { scale: 1.02 } : {}}
                whileTap={!answered ? { scale: 0.97 } : {}}
              >
                <span className="option-letter">{optionLetters[i]}</span>
                <span className="option-text">{opt}</span>
                {answered && i === q.correct_index && <Check size={16} className="option-icon" strokeWidth={3} />}
                {answered && i === selected && i !== q.correct_index && <X size={16} className="option-icon" strokeWidth={3} />}
              </motion.button>
            )
          })}
        </motion.div>
      </AnimatePresence>

      {/* Feedback toast */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            className={`speed-feedback feedback-${feedback.type}`}
            initial={{ opacity: 0, y: -16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.18 }}
          >
            {feedback.type === 'correct' ? (
              <><Check size={22} /> +{feedback.xp} XP {feedback.combo > 1 && <span className="combo-txt">×{feedback.combo}</span>}</>
            ) : (
              <X size={22} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}