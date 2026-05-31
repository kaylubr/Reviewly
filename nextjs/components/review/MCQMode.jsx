'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ChevronRight } from 'lucide-react'

const bgIcon = '/assets/mcq/mcq-question-bg-icon.png'

export default function MCQMode({ questions, onComplete }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [startTime] = useState(Date.now())

  const q = questions[index]
  const total = questions.length
  const optionLetters = ['A', 'B', 'C', 'D']

  function handleSelect(i) {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    if (i === q.correct_index) setCorrect(c => c + 1)
  }

  function handleNext() {
    if (index + 1 >= total) {
      onComplete({
        correct_answers: correct + (selected === q.correct_index ? 0 : 0), // already counted
        total_questions: total,
        duration_seconds: Math.round((Date.now() - startTime) / 1000),
      })
    } else {
      setIndex(i => i + 1)
      setSelected(null)
      setAnswered(false)
    }
  }

  const isCorrect = selected === q.correct_index

  function getOptionState(i) {
    if (!answered) return 'idle'
    if (i === q.correct_index) return 'correct'
    if (i === selected) return 'wrong'
    return 'dim'
  }

  return (
    <div className="mcq-wrapper">
      {/* Progress */}
      <div className="mcq-progress-bar">
        <div className="mcq-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <p className="mcq-progress-text">{index + 1} / {total} &nbsp;·&nbsp; {correct} correct</p>

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
            {q.question}
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
          {q.options.map((opt, i) => {
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

      {/* Feedback bar + Next button */}
      <AnimatePresence>
        {answered && (
          <motion.div
            className={`mcq-feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="feedback-left">
              <span className="feedback-label">{isCorrect ? 'Correct!' : 'Incorrect'}</span>
              {q.explanation && (
                <span className="feedback-explanation">{q.explanation}</span>
              )}
            </div>
            <motion.button
              className="btn-next"
              onClick={handleNext}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {index + 1 >= total ? 'Results' : 'Next'}
              <ChevronRight size={15} strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
