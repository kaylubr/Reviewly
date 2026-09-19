'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { getInsforgeClient } from '@/lib/insforge'
import { useAuth } from '@/contexts/AuthContext'
import { useLoading } from '@/contexts/LoadingContext'
import toast from 'react-hot-toast'

function AuthContent() {
  const searchParams = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin')
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [oauthLoading, setOauthLoading] = useState(null)
  const { user, handleAuthSuccess } = useAuth()
  const { startLoading, stopLoading } = useLoading()
  const router = useRouter()

  useEffect(() => {
    if (user) router.push('/dashboard')
  }, [user, router])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    startLoading()
    const insforge = getInsforgeClient()
    try {
      if (mode === 'signup') {
        const { data, error } = await insforge.auth.signUp({ email: form.email, password: form.password, name: form.name })
        if (error) throw error
        if (data?.requireEmailVerification) {
          setStep('verify')
          toast.success('Check your email for a verification code!')
        } else if (data?.accessToken) {
          await handleAuthSuccess(data.user, data.accessToken)
          toast.success('Account created! Welcome to Reviewly.')
          router.push('/dashboard')
        }
      } else {
        const { data, error } = await insforge.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) {
          if (error.statusCode === 403) {
            setStep('verify')
            toast('Please verify your email first.')
          } else if (error.statusCode === 404 || error.message?.toLowerCase().includes('not found')) {
            toast.error("You don't have an account yet. Please sign up first.")
            setMode('signup')
          } else if (error.statusCode === 401) {
            toast.error('Incorrect email or password.')
          } else {
            throw error
          }
        } else {
          await handleAuthSuccess(data.user, data.accessToken)
          toast.success('Welcome back!')
          router.push('/dashboard')
        }
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
      stopLoading()
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    setLoading(true)
    startLoading()
    const insforge = getInsforgeClient()
    try {
      const { data, error } = await insforge.auth.verifyEmail({ email: form.email, otp })
      if (error) throw error
      if (data?.accessToken) await handleAuthSuccess(data.user, data.accessToken)
      toast.success('Email verified! Welcome to Reviewly.')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Invalid code')
    } finally {
      setLoading(false)
      stopLoading()
    }
  }

  async function handleOAuth(provider) {
    setOauthLoading(provider)
    startLoading()
    const insforge = getInsforgeClient()
    const { error } = await insforge.auth.signInWithOAuth({
      provider, redirectTo: `${window.location.origin}/auth`,
    })
    if (error) {
      if (error.statusCode === 404 || error.message?.toLowerCase().includes('not found')) {
        toast.error("You don't have an account yet. Please sign up first.")
        setMode('signup')
      } else {
        toast.error(error.message)
      }
      setOauthLoading(null)
      stopLoading()
    }
  }

  return (
    <div className="auth-page">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <button className="back-btn" onClick={() => router.push('/')}>
          <ArrowLeft size={15} /> Back
        </button>

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img src="/assets/reviewly-logo.png" alt="Logo" />
          </div>
          <h1>Reviewly</h1>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div key="form" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
              <p className="auth-subtitle">
                {mode === 'signup' ? 'Start growing your knowledge tree today' : 'Continue your learning journey'}
              </p>

              <div className="oauth-buttons">
                <button className="oauth-btn" onClick={() => handleOAuth('google')} disabled={!!oauthLoading}>
                  {oauthLoading === 'google' ? <span className="spinner" /> : <img src="https://www.google.com/favicon.ico" width={15} height={15} alt="" />}
                  Continue with Google
                </button>
                <button className="oauth-btn" onClick={() => handleOAuth('github')} disabled={!!oauthLoading}>
                  {oauthLoading === 'github' ? <span className="spinner" /> : null}
                  Continue with GitHub
                </button>
              </div>

              <div className="divider"><span>or</span></div>

              <form onSubmit={handleSubmit} className="auth-form">
                {mode === 'signup' && (
                  <div className="input-group">
                    <User size={15} />
                    <input type="text" name="name" placeholder="Full name" value={form.name} onChange={handleChange} required />
                  </div>
                )}
                <div className="input-group">
                  <Mail size={15} />
                  <input type="email" name="email" placeholder="Email address" value={form.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <Lock size={15} />
                  <input type={showPass ? 'text' : 'password'} name="password" placeholder="Password" value={form.password} onChange={handleChange} required minLength={6} />
                  <button type="button" onClick={() => setShowPass(s => !s)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <motion.button type="submit" className="btn-primary w-full" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {loading ? <span className="spinner" /> : mode === 'signup' ? 'Create Account' : 'Sign In'}
                </motion.button>
              </form>

              <p className="auth-switch">
                {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
                <button onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setStep('form') }}>
                  {mode === 'signup' ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.div key="verify" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <h2>Verify your email</h2>
              <p className="auth-subtitle">We sent a code to {form.email}</p>
              <form onSubmit={handleVerify} className="auth-form">
                <div className="input-group">
                  <Mail size={15} />
                  <input type="text" placeholder="Verification code" value={otp} onChange={e => setOtp(e.target.value)} required />
                </div>
                <motion.button type="submit" className="btn-primary w-full" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {loading ? <span className="spinner" /> : 'Verify Email'}
                </motion.button>
              </form>
              <p className="auth-switch">
                <button onClick={() => setStep('form')}>← Back to sign in</button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function Auth() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card"><span className="spinner-lg" /></div></div>}>
      <AuthContent />
    </Suspense>
  )
}
