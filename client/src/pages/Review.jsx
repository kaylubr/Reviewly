import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, X } from 'lucide-react'
import { apiRequest } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import FlashcardMode from '../components/review/FlashcardMode'
import MCQMode from '../components/review/MCQMode'
import SpeedMode from '../components/review/SpeedMode'
import SessionComplete from '../components/review/SessionComplete'
import toast from 'react-hot-toast'

export default function Review() {
  const { moduleId, mode } = useParams()
  const navigate = useNavigate()
  const { token, refreshProfile } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionState, setSessionState] = useState('playing') // 'playing' | 'complete'
  const [result, setResult] = useState(null)

  useEffect(() => {
    loadQuestions()
  }, [moduleId, mode])

  async function loadQuestions() {
    setLoading(true)
    try {
      let data
      if (mode === 'flashcard') {
        data = await apiRequest(`/api/modules/${moduleId}/flashcards`, {}, token)
      } else if (mode === 'mcq') {
        data = await apiRequest(`/api/modules/${moduleId}/mcq?count=10`, {}, token)
      } else if (mode === 'speed') {
        data = await apiRequest(`/api/modules/${moduleId}/speed`, {}, token)
      }
      if (!data || data.length === 0) {
        toast.error('No questions found. Please regenerate the module.')
        navigate(`/modules/${moduleId}`)
        return
      }
      setQuestions(data)
    } catch (e) {
      toast.error(e.message)
      navigate(`/modules/${moduleId}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleComplete(stats) {
    try {
      const res = await apiRequest('/api/sessions/complete', {
        method: 'POST',
        body: JSON.stringify({ module_id: moduleId, mode, ...stats })
      }, token)
      setResult(res)
      setSessionState('complete')
      await refreshProfile()
    } catch (err) {
      toast.error('Failed to save session')
      setResult({ xp_earned: stats.correct_answers * 10, new_level: 1, leveled_up: false, new_streak: 1, score: 0, new_achievements: [] })
      setSessionState('complete')
    }
  }

  if (loading) {
    return (
      <div className="review-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="loading-ring"
        />
        <p>Loading your session...</p>
      </div>
    )
  }

  return (
    <div className="review-page">
      {sessionState === 'playing' && (
        <>
          <div className="review-topbar">
            <button className="review-exit-btn" onClick={() => navigate(`/modules/${moduleId}`)}>
              <X size={18} />
            </button>
            <div className="mode-label">
              {mode === 'flashcard' && '🃏 Flashcard Mode'}
              {mode === 'mcq' && '🎯 Multiple Choice'}
              {mode === 'speed' && '⚡ Speed Round'}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'flashcard' && questions.length > 0 && (
              <FlashcardMode key="flash" questions={questions} onComplete={handleComplete} />
            )}
            {mode === 'mcq' && questions.length > 0 && (
              <MCQMode key="mcq" questions={questions} onComplete={handleComplete} />
            )}
            {mode === 'speed' && questions.length > 0 && (
              <SpeedMode key="speed" questions={questions} onComplete={handleComplete} />
            )}
          </AnimatePresence>
        </>
      )}

      {sessionState === 'complete' && result && (
        <SessionComplete
          result={result}
          mode={mode}
          onPlayAgain={() => { setSessionState('playing'); loadQuestions() }}
          onDashboard={() => navigate('/dashboard')}
          onModules={() => navigate(`/modules/${moduleId}`)}
        />
      )}
    </div>
  )
}


