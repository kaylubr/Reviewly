import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Play, Zap, Brain, Target, Tag, RotateCcw, Sparkles, Trash2, BookOpen } from 'lucide-react'
import { insforge } from '../lib/insforge'
import { apiRequest } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const MODES = [
  { id: 'flashcard', icon: BookOpen, title: 'Flashcard Mode', desc: 'Flip cards at your own pace. Mark what you know and what needs review.', color: 'emerald', xp: '10 XP / card' },
  { id: 'mcq',       icon: Target,   title: 'Multiple Choice', desc: 'AI-crafted questions with instant feedback and difficulty scaling.', color: 'violet', xp: '15 XP / question' },
  { id: 'speed',     icon: Zap,      title: 'Speed Round', desc: 'Race the clock. Combo multipliers and streak bonuses.', color: 'amber', xp: '20 XP / question' },
]

export default function ModuleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [module, setModule] = useState(null)
  const [stats, setStats] = useState({ flashcards: 0, questions: 0 })
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { loadModule() }, [id])

  async function loadModule() {
    setLoading(true)
    try {
      const [modRes, fcRes, mcqRes] = await Promise.all([
        insforge.database.from('modules').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
        insforge.database.from('flashcards').select('id').eq('module_id', id),
        insforge.database.from('mcq_questions').select('id').eq('module_id', id),
      ])
      if (!modRes.data) { navigate('/dashboard'); return }
      setModule(modRes.data)
      setStats({ flashcards: fcRes.data?.length || 0, questions: mcqRes.data?.length || 0 })
    } catch { toast.error('Failed to load module') }
    finally { setLoading(false) }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const result = await apiRequest(`/api/modules/${id}/generate`, { method: 'POST' }, token)
      toast.success(`Regenerated: ${result.flashcards_count} flashcards, ${result.mcq_count} questions`)
      setStats({ flashcards: result.flashcards_count, questions: result.mcq_count })
    } catch (err) { toast.error(err.message) }
    finally { setRegenerating(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await apiRequest(`/api/modules/${id}`, { method: 'DELETE' }, token)
      toast.success('Module deleted')
      navigate('/dashboard')
    } catch (err) { toast.error(err.message); setDeleting(false); setDeleteConfirm(false) }
  }

  if (loading) return <div className="page loading-page"><span className="spinner-lg" /></div>

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
            {(module.tags || []).map(t => (
              <span key={t} className="tag"><Tag size={10} /> {t}</span>
            ))}
          </div>
          <h1>{module.title}</h1>
          {module.description && <p className="module-desc">{module.description}</p>}
          <div className="module-meta">
            <span><Brain size={13} /> {stats.flashcards} flashcards</span>
            <span><Target size={13} /> {stats.questions} questions</span>
            <span className={`mastery-badge mastery-${getMasteryLevel(module.mastery_score)}`}>
              {module.mastery_score}% mastery
            </span>
          </div>
        </div>
        <div className="module-actions">
          <button className="btn-ghost btn-sm regen-btn" onClick={handleRegenerate} disabled={regenerating}>
            {regenerating ? <span className="spinner" /> : <RotateCcw size={14} />}
            {regenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
          <button className="btn-ghost btn-sm delete-btn" onClick={() => setDeleteConfirm(true)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div className="modal-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => !deleting && setDeleteConfirm(false)}>
            <motion.div className="modal-dialog"
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}>
              <h2>Delete Module?</h2>
              <p>Are you sure you want to delete <strong>{module.title}</strong>? This cannot be undone and will remove all flashcards, questions, and sessions.</p>
              <div className="modal-actions">
                <button className="btn-secondary" onClick={() => setDeleteConfirm(false)} disabled={deleting}>Cancel</button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? <span className="spinner" /> : <Trash2 size={13} />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {!module.ai_processed && (
        <motion.div className="ai-notice" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Sparkles size={15} />
          <span>AI is still processing this module. Generate questions to start reviewing.</span>
          <button className="btn-primary btn-sm" onClick={handleRegenerate} disabled={regenerating}>
            Generate Now
          </button>
        </motion.div>
      )}

      <p className="modes-title">Choose a Review Mode</p>

      <div className="review-modes">
        {MODES.map((mode, i) => (
          <motion.div
            key={mode.id}
            className={`mode-select-card mode-${mode.color}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -5, scale: 1.01 }}
            onClick={() => navigate(`/review/${id}/${mode.id}`)}
          >
            <div className="mode-select-icon">
              <mode.icon size={20} strokeWidth={2} />
            </div>
            <h3>{mode.title}</h3>
            <p>{mode.desc}</p>
            <div className="mode-xp-badge">{mode.xp}</div>
            <button className="btn-primary btn-sm mode-start-btn">
              <Play size={13} /> Start
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function getMasteryLevel(score) {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}