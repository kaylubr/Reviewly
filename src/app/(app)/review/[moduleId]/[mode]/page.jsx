'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { apiRequest } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import FlashcardMode from '@/components/review/FlashcardMode'
import MCQMode from '@/components/review/MCQMode'
import SpeedMode from '@/components/review/SpeedMode'
import SessionComplete from '@/components/review/SessionComplete'
import toast from 'react-hot-toast'

const MODE_LABELS = {
  flashcard: 'Flashcard Mode',
  mcq: 'Multiple Choice',
  speed: 'Speed Round',
}

export default function Review() {
  const { moduleId, mode } = useParams()
  const router = useRouter()
  const { token, refreshProfile } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sessionState, setSessionState] = useState('playing')
  const [result, setResult] = useState(null)

  useEffect(() => { if (token) loadQuestions() }, [moduleId, mode, token])

  async function loadQuestions() {
    setLoading(true)
    try {
      let data
      if (mode === 'flashcard') data = await apiRequest(`/api/modules/${moduleId}/flashcards`, {}, token)
      else if (mode === 'mcq')  data = await apiRequest(`/api/modules/${moduleId}/mcq?count=10`, {}, token)
      else if (mode === 'speed') data = await apiRequest(`/api/modules/${moduleId}/speed`, {}, token)

      if (!data || data.length === 0) {
        toast.error('No questions found. Please regenerate the module.')
        router.push(`/modules/${moduleId}`)
        return
      }
      setQuestions(data)
    } catch (e) {
      toast.error(e.message)
      router.push(`/modules/${moduleId}`)
    } finally { setLoading(false) }
  }

  async function handleComplete(stats) {
    setSessionState('completing')
    try {
      const res = await apiRequest('/api/sessions/complete', {
        method: 'POST',
        body: JSON.stringify({ module_id: moduleId, mode, ...stats }),
      }, token)
      setResult(res)
      await refreshProfile()
    } catch {
      setResult({ xp_earned: (stats.correct_answers || 0) * 10, new_level: 1, leveled_up: false, new_streak: 1, score: 0, new_achievements: [] })
    } finally { setSessionState('complete') }
  }

  if (loading || sessionState === 'completing') {
    return (
      <div className="review-loading">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--lime)', borderRadius: '50%' }} />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          {loading ? 'Loading your session...' : 'Finalizing results...'}
        </p>
      </div>
    )
  }

  return (
    <div className="review-page">
      {sessionState === 'playing' && (
        <>
          <div className="review-topbar">
            <button className="review-exit-btn" onClick={() => router.push(`/modules/${moduleId}`)}><X size={17} /></button>
            <span className="mode-label">{MODE_LABELS[mode] || mode}</span>
            <div style={{ width: 36 }} />
          </div>
          <AnimatePresence mode="wait">
            {mode === 'flashcard' && questions.length > 0 && <FlashcardMode key="flash" questions={questions} onComplete={handleComplete} />}
            {mode === 'mcq' && questions.length > 0 && <MCQMode key="mcq" questions={questions} onComplete={handleComplete} />}
            {mode === 'speed' && questions.length > 0 && <SpeedMode key="speed" questions={questions} onComplete={handleComplete} />}
          </AnimatePresence>
        </>
      )}
      {sessionState === 'complete' && result && (
        <SessionComplete result={result} mode={mode}
          onPlayAgain={() => { setSessionState('playing'); loadQuestions() }}
          onDashboard={() => router.push('/dashboard')}
          onModules={() => router.push(`/modules/${moduleId}`)} />
      )}
    </div>
  )
}
