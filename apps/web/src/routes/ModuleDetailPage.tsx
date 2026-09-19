import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Brain, Play, Tag, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router';
import { useDeleteModule, useModule } from '../lib/modules';

const MODES = [
  {
    id: 'flashcard',
    icon: '/assets/stat_card/Exp.svg',
    title: 'Flashcard Mode',
    desc: 'Flip cards at your own pace. Mark what you know and what needs review.',
    color: 'emerald',
  },
  {
    id: 'mcq',
    icon: '/assets/stat_card/Sessions.svg',
    title: 'Multiple Choice',
    desc: 'AI-crafted questions with instant feedback and difficulty scaling.',
    color: 'violet',
  },
  {
    id: 'speed',
    icon: '/assets/stat_card/StudyTime.svg',
    title: 'Speed Round',
    desc: 'Race the clock. Combo multipliers and streak bonuses.',
    color: 'amber',
  },
];

function getMasteryLevel(score: number) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

export function ModuleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: module, isPending } = useModule(id);
  const deleteModule = useDeleteModule();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  async function handleDelete() {
    if (!id) return;

    try {
      await deleteModule.mutateAsync(id);
      toast.success('Module deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete module');
      setDeleteConfirm(false);
    }
  }

  if (isPending) {
    return (
      <div className="page loading-page">
        <span className="spinner-lg" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="page loading-page">
        <p>Module not found.</p>
      </div>
    );
  }

  return (
    <div className="page module-detail">
      <div className="page-header">
        <button className="btn-ghost btn-sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={14} /> Dashboard
        </button>
      </div>

      <div className="module-hero">
        <div>
          <div className="tags-row">
            {module.tags.map((tag) => (
              <span key={tag} className="tag">
                <Tag size={10} /> {tag}
              </span>
            ))}
          </div>
          <h1>{module.title}</h1>
          {module.description && <p className="module-desc">{module.description}</p>}
          <div className="module-meta">
            <span>
              <Brain size={13} /> {module.flashcardCount} flashcards
            </span>
            <span>
              <Target size={13} /> {module.questionCount} questions
            </span>
            <span className={`mastery-badge mastery-${getMasteryLevel(module.masteryScore)}`}>
              {module.masteryScore}% mastery
            </span>
          </div>
        </div>
        <div className="module-actions">
          <button
            className="btn-ghost btn-sm delete-btn"
            onClick={() => setDeleteConfirm(true)}
            aria-label="Delete module"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              if (!deleteModule.isPending) setDeleteConfirm(false);
            }}
          >
            <motion.div
              className="modal-dialog"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(event) => event.stopPropagation()}
            >
              <h2>Delete Module?</h2>
              <p>
                Are you sure you want to delete <strong>{module.title}</strong>? This cannot be undone
                and will remove all flashcards, questions, and sessions.
              </p>
              <div className="modal-actions">
                <button
                  className="btn-secondary no-icon"
                  onClick={() => setDeleteConfirm(false)}
                  disabled={deleteModule.isPending}
                >
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={deleteModule.isPending}
                >
                  {deleteModule.isPending ? <span className="spinner" /> : <Trash2 size={13} />}
                  {deleteModule.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="modes-title">Choose a Review Mode</p>

      <div className="review-modes">
        {MODES.map((mode) => (
          <div key={mode.id} className={`mode-select-card mode-${mode.color}`}>
            <div className="mode-select-icon">
              <img src={mode.icon} alt={mode.title} />
            </div>
            <h3>{mode.title}</h3>
            <p>{mode.desc}</p>
            <button
              className="btn-primary btn-sm mode-start-btn"
              onClick={() => navigate(`/review/${module.id}/${mode.id}`)}
            >
              <Play size={13} /> Start
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
