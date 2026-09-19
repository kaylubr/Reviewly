import type { FlashcardDto } from '@reviewly/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import type { SessionStats } from '../../lib/review';

type FlashcardModeProps = {
  flashcards: FlashcardDto[];
  onComplete: (stats: SessionStats) => void;
};

const DIFFICULTY_LABELS = ['', 'Easy', 'Medium', 'Hard'];
const DIFFICULTY_CLASSES = ['', 'easy', 'medium', 'hard'];

function DifficultyBadge({ level }: { level: number }) {
  if (!level || level > 3) {
    return null;
  }

  return <span className={`difficulty-badge diff-${DIFFICULTY_CLASSES[level]}`}>{DIFFICULTY_LABELS[level]}</span>;
}

export function FlashcardMode({ flashcards, onComplete }: FlashcardModeProps) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [needReview, setNeedReview] = useState(0);
  const [startTime] = useState(() => Date.now());
  const [completed, setCompleted] = useState(false);

  const card = flashcards[index];
  const total = flashcards.length;

  if (!card) {
    return null;
  }

  function advance(knownCount: number) {
    setFlipped(false);

    if (index + 1 >= total) {
      setCompleted(true);
      onComplete({
        correctAnswers: knownCount,
        totalQuestions: total,
        durationSeconds: Math.round((Date.now() - startTime) / 1000),
      });
      return;
    }

    setTimeout(() => setIndex((current) => current + 1), 160);
  }

  function handleKnow() {
    if (completed) return;
    const next = known + 1;
    setKnown(next);
    advance(next);
  }

  function handleReview() {
    if (completed) return;
    setNeedReview((current) => current + 1);
    advance(known);
  }

  return (
    <div className="flashcard-mode">
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${(index / total) * 100}%` }} />
      </div>
      <p className="progress-text">
        {index + 1} / {total}
      </p>

      <div className="flashcard-scene" onClick={() => setFlipped((current) => !current)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${flipped ? 'b' : 'f'}`}
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
  );
}
