import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, ChevronRight } from 'lucide-react'

export default function MCQMode({ questions, onComplete }) {
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [startTime] = useState(Date.now())

  const q = questions[index]
  const total = questions.length
  const optionLetters = ['A', 'B', 'C', 'D']

  function handleSelect(i) {
    if (answered || completed) return
    setSelected(i)
    setAnswered(true)
    if (i === q.correct_index) setCorrect(c => c + 1)
  }

  function handleNext() {
    if (completed) return
    if (index + 1 >= total) {
      setCompleted(true)
      onComplete({
        correct_answers: correct,
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

  return (
    <div className="mcq-mode">
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${(index / total) * 100}%` }} />
      </div>
      <p className="progress-text">{index + 1} / {total} · {correct} correct</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="mcq-card"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22 }}
        >
          <p className="mcq-question">{q.question}</p>

          <div className="mcq-options">
            {q.options.map((opt, i) => {
              let state = 'idle'
              if (answered) {
                if (i === q.correct_index) state = 'correct'
                else if (i === selected) state = 'wrong'
                else state = 'dim'
              }

              return (
                <motion.button
                  key={i}
                  className={`mcq-option option-${state}`}
                  onClick={() => handleSelect(i)}
                  whileHover={!answered ? { scale: 1.02 } : {}}
                  whileTap={!answered ? { scale: 0.98 } : {}}
                >
                  <span className="option-letter">{optionLetters[i]}</span>
                  <span className="option-text">{opt}</span>
                  {answered && i === q.correct_index && <Check size={15} className="option-icon" />}
                  {answered && i === selected && i !== q.correct_index && <X size={15} className="option-icon" />}
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence>
            {answered && (
              <motion.div
                className={`explanation-box ${isCorrect ? 'correct' : 'wrong'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <p className="explanation-header">
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
                {q.explanation && (
                  <p className="explanation-text">{q.explanation}</p>
                )}
                <motion.button
                  className="btn-primary"
                  onClick={handleNext}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {index + 1 >= total ? 'See Results' : 'Next Question'}
                  <ChevronRight size={15} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}