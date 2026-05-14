import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Play, Zap, Brain, Target, Tag, RotateCcw, Sparkles } from 'lucide-react'
import { insforge } from '../lib/insforge'
import { apiRequest } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const MODES = [
  {
    id: 'flashcard',
    icon: '🃏',
    title: 'Flashcard Mode',
    desc: 'Flip cards with spaced repetition. Master each concept at your own pace.',
    color: 'emerald',
    xp: '10 XP / card'
  },
  {
    id: 'mcq',
    icon: '🎯',
    title: 'Multiple Choice',
    desc: 'AI-crafted questions with instant feedback and difficulty scaling.',
    color: 'violet',
    xp: '15 XP / question'
  },
  {
    id: 'speed',
    icon: '⚡',
    title: 'Speed Round',
    desc: 'Race the clock! Combo multipliers and streak bonuses make it thrilling.',
    color: 'amber',
    xp: '20 XP / question'
  }
]

export default function ModuleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, token } = useAuth()
  const [module, setModule] = useState(null)
  const [stats, setStats] = useState({ flashcards: 0, questions: 0 })
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    loadModule()
  }, [id])

  async function loadModule() {
    setLoading(true)
    try {
      const [modRes, fcRes, mcqRes] = await Promise.all([
        insforge.database.from('modules').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
        insforge.database.from('flashcards').select('id').eq('module_id', id),
        insforge.database.from('mcq_questions').select('id').eq('module_id', id)
      ])
      if (!modRes.data) { navigate('/dashboard'); return }
      setModule(modRes.data)
      setStats({ flashcards: fcRes.data?.length || 0, questions: mcqRes.data?.length || 0 })
    } catch (e) {
      toast.error('Failed to load module')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerate() {
    setRegenerating(true)
    try {
      const result = await apiRequest(`/api/modules/${id}/generate`, { method: 'POST' }, token)
      toast.success(`Regenerated: ${result.flashcards_count} flashcards, ${result.mcq_count} questions`)
      setStats({ flashcards: result.flashcards_count, questions: result.mcq_count })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) return <div className="page loading-page"><span className="spinner-lg" /></div>

  return (
    <div className="page module-detail">
      <div className="page-header">
        <button className="btn-ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={16} /> Dashboard
        </button>
      </div>

      <div className="module-hero">
        <div>
          <div className="tags-row">
            {(module.tags || []).map(t => (
              <span key={t} className="tag"><Tag size={11} /> {t}</span>
            ))}
          </div>
          <h1>{module.title}</h1>
          {module.description && <p className="module-desc">{module.description}</p>}
          <div className="module-meta">
            <span><Brain size={14} /> {stats.flashcards} flashcards</span>
            <span><Target size={14} /> {stats.questions} questions</span>
            <span className={`mastery-badge mastery-${getMasteryLevel(module.mastery_score)}`}>
              {module.mastery_score}% mastery
            </span>
          </div>
        </div>
        <button
          className="btn-ghost regen-btn"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          {regenerating ? <span className="spinner" /> : <RotateCcw size={16} />}
          {regenerating ? 'Regenerating...' : 'Regenerate'}
        </button>
      </div>

      {!module.ai_processed && (
        <motion.div
          className="ai-notice"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Sparkles size={16} />
          <span>AI is still processing this module. Generate questions to start reviewing.</span>
          <button className="btn-primary btn-sm" onClick={handleRegenerate} disabled={regenerating}>
            Generate Now
          </button>
        </motion.div>
      )}

      <h2 className="modes-title">Choose a Review Mode</h2>

      <div className="modes-grid review-modes">
        {MODES.map((mode, i) => (
          <motion.div
            key={mode.id}
            className={`mode-select-card mode-${mode.color}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -6, scale: 1.02 }}
            onClick={() => navigate(`/review/${id}/${mode.id}`)}
          >
            <div className="mode-select-icon">{mode.icon}</div>
            <h3>{mode.title}</h3>
            <p>{mode.desc}</p>
            <div className="mode-xp-badge">{mode.xp}</div>
            <button className="btn-primary mode-start-btn">
              <Play size={14} /> Start
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


