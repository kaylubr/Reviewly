import type { McqQuestionDto } from '@reviewly/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { SessionStats } from '../../lib/review';

const BACKGROUND_ICON = '/assets/mcq/mcq-question-bg-icon.png';
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const ROUND_SECONDS = 60;

type SpeedModeProps = {
  questions: McqQuestionDto[];
  onComplete: (stats: SessionStats) => void;
};

export function SpeedMode({ questions, onComplete }: SpeedModeProps) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const correctRef = useRef(0);
  const attemptedRef = useRef(0);
  const timeLeftRef = useRef(ROUND_SECONDS);
  const finishedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);

      if (timeLeftRef.current <= 0) {
        finishRound();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  function finishRound() {
    if (finishedRef.current) {
      return;
    }

    finishedRef.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    onCompleteRef.current({
      correctAnswers: correctRef.current,
      totalQuestions: Math.max(attemptedRef.current, 1),
      durationSeconds: ROUND_SECONDS - Math.max(timeLeftRef.current, 0),
    });
  }

  const question = questions[index];

  function handleSelect(option: number) {
    if (answered || finishedRef.current || !question) {
      return;
    }

    setSelected(option);
    setAnswered(true);
    attemptedRef.current += 1;

    if (option === question.correctIndex) {
      correctRef.current += 1;
      setCorrect(correctRef.current);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setAnswered(false);
      setSelected(null);

      if (index + 1 >= questions.length) {
        finishRound();
        return;
      }

      setIndex((current) => current + 1);
    }, 600);
  }

  if (!question) {
    return null;
  }

  const timerPercentage = (timeLeft / ROUND_SECONDS) * 100;

  function optionState(option: number) {
    if (!answered) return 'idle';
    if (option === question?.correctIndex) return 'correct';
    if (option === selected) return 'wrong';
    return 'dim';
  }

  return (
    <div className="mcq-wrapper">
      <div className="speed-timer-bar">
        <motion.div
          className="speed-timer-fill"
          animate={{ width: `${timerPercentage}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      <p className="mcq-progress-text">
        {timeLeft}s &nbsp;·&nbsp; {correct} correct
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
        {feedback && (
          <motion.div
            className={`speed-feedback feedback-${feedback}`}
            initial={{ opacity: 0, y: -16, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.18 }}
          >
            {feedback === 'correct' ? <Check size={22} /> : <X size={22} />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
