import type { ReviewMode } from '@reviewly/shared';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import { FlashcardMode } from '../components/review/FlashcardMode';
import { MCQMode } from '../components/review/MCQMode';
import { SessionComplete } from '../components/review/SessionComplete';
import { SpeedMode } from '../components/review/SpeedMode';
import {
  reviewSessionIsEmpty,
  scoreFor,
  useCompleteSession,
  useReviewSession,
  type ReviewOutcome,
  type SessionStats,
} from '../lib/review';

const MODE_LABELS: Record<ReviewMode, string> = {
  flashcard: 'Flashcard Mode',
  mcq: 'Multiple Choice',
  speed: 'Speed Round',
};

const REVIEW_MODES: ReviewMode[] = ['flashcard', 'mcq', 'speed'];

export function ReviewPage() {
  const { moduleId, mode } = useParams();
  const navigate = useNavigate();
  const reviewMode = REVIEW_MODES.find((candidate) => candidate === mode) ?? 'flashcard';

  const { data, isPending, refetch } = useReviewSession(moduleId, reviewMode);
  const completeSession = useCompleteSession();
  const [outcome, setOutcome] = useState<ReviewOutcome | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  useEffect(() => {
    if (data && reviewSessionIsEmpty(data)) {
      toast.error('No questions for this module yet. Generate them first.');
      navigate(`/modules/${moduleId}`, { replace: true });
    }
  }, [data, moduleId, navigate]);

  async function handleComplete(stats: SessionStats) {
    if (!moduleId) {
      return;
    }

    try {
      const completed = await completeSession.mutateAsync({ moduleId, mode: reviewMode, ...stats });

      setOutcome({
        score: completed.score,
        saved: true,
        moduleTotalSessions: completed.moduleTotalSessions,
        masteryScore: completed.masteryScore,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save this session');
      setOutcome({
        score: scoreFor(stats),
        saved: false,
        moduleTotalSessions: null,
        masteryScore: null,
      });
    }
  }

  function handlePlayAgain() {
    setOutcome(null);
    void refetch();
  }

  if (isPending || completeSession.isPending) {
    return (
      <div className="review-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            border: '3px solid var(--border)',
            borderTopColor: 'var(--lime)',
            borderRadius: '50%',
          }}
        />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {isPending ? 'Loading your session...' : 'Finalizing results...'}
        </p>
      </div>
    );
  }

  return (
    <div className="review-page">
      {!outcome && data && (
        <>
          <div className="review-topbar">
            <button className="review-exit-btn" onClick={() => setShowExitConfirm(true)}>
              <X size={17} />
            </button>
            <span className="mode-label">{MODE_LABELS[reviewMode]}</span>
            <div style={{ width: 36 }} />
          </div>

          <AnimatePresence>
            {showExitConfirm && (
              <motion.div
                className="modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExitConfirm(false)}
              >
                <motion.div
                  className="modal-dialog"
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <h2>Leave review session?</h2>
                  <p>If you exit now, your current progress will not be saved.</p>
                  <div className="modal-actions">
                    <button className="btn-secondary no-icon" onClick={() => setShowExitConfirm(false)}>
                      Cancel
                    </button>
                    <button
                      className="btn-danger no-icon"
                      onClick={() => {
                        setShowExitConfirm(false);
                        navigate(`/modules/${moduleId}`);
                      }}
                    >
                      Exit anyway
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {data.mode === 'flashcard' && data.flashcards.length > 0 && (
              <FlashcardMode key="flashcard" flashcards={data.flashcards} onComplete={handleComplete} />
            )}
            {data.mode === 'mcq' && data.questions.length > 0 && (
              <MCQMode key="mcq" questions={data.questions} onComplete={handleComplete} />
            )}
            {data.mode === 'speed' && data.questions.length > 0 && (
              <SpeedMode key="speed" questions={data.questions} onComplete={handleComplete} />
            )}
          </AnimatePresence>
        </>
      )}

      {outcome && (
        <SessionComplete
          outcome={outcome}
          mode={reviewMode}
          onPlayAgain={handlePlayAgain}
          onDashboard={() => navigate('/dashboard')}
          onModules={() => navigate(`/modules/${moduleId}`)}
        />
      )}
    </div>
  );
}
