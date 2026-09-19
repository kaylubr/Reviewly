import type { McqQuestionDto } from '@reviewly/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronRight, X } from 'lucide-react';
import { useState } from 'react';
import type { SessionStats } from '../../lib/review';

const BACKGROUND_ICON = '/assets/mcq/mcq-question-bg-icon.png';
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

type MCQModeProps = {
  questions: McqQuestionDto[];
  onComplete: (stats: SessionStats) => void;
};

export function MCQMode({ questions, onComplete }: MCQModeProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [startTime] = useState(() => Date.now());

  const question = questions[index];
  const total = questions.length;

  if (!question) {
    return null;
  }

  function handleSelect(option: number) {
    if (answered || !question) return;

    setSelected(option);
    setAnswered(true);

    if (option === question.correctIndex) {
      setCorrect((current) => current + 1);
    }
  }

  function handleNext() {
    if (index + 1 >= total) {
      onComplete({
        correctAnswers: correct,
        totalQuestions: total,
        durationSeconds: Math.round((Date.now() - startTime) / 1000),
      });
      return;
    }

    setIndex((current) => current + 1);
    setSelected(null);
    setAnswered(false);
  }

  const isCorrect = selected === question.correctIndex;

  function optionState(option: number) {
    if (!answered) return 'idle';
    if (option === question?.correctIndex) return 'correct';
    if (option === selected) return 'wrong';
    return 'dim';
  }

  return (
    <div className="mcq-wrapper">
      <div className="mcq-progress-bar">
        <div className="mcq-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
      </div>
      <p className="mcq-progress-text">
        {index + 1} / {total} &nbsp;·&nbsp; {correct} correct
      </p>

      <div className="mcq-question-area">
        <img src={BACKGROUND_ICON} className="mcq-question-bg-icon" alt="" aria-hidden="true" />
        <AnimatePresence mode="wait">
          <motion.p
            key={`q-${index}`}
            className="mcq-question"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {question.question}
          </motion.p>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`opts-${index}`}
          className="mcq-options"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {question.options.map((option, optionIndex) => {
            const state = optionState(optionIndex);

            return (
              <motion.button
                key={option}
                className={`mcq-option option-${state}`}
                onClick={() => handleSelect(optionIndex)}
                whileHover={!answered ? { scale: 1.02 } : {}}
                whileTap={!answered ? { scale: 0.97 } : {}}
              >
                <span className="option-letter">{OPTION_LETTERS[optionIndex]}</span>
                <span className="option-text">{option}</span>
                {answered && optionIndex === question.correctIndex && (
                  <Check size={16} className="option-icon" strokeWidth={3} />
                )}
                {answered && optionIndex === selected && optionIndex !== question.correctIndex && (
                  <X size={16} className="option-icon" strokeWidth={3} />
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

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
              {question.explanation && (
                <span className="feedback-explanation">{question.explanation}</span>
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
  );
}
