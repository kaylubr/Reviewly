import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Leaf } from 'lucide-react'
import { insforge } from '../lib/insforge'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

import reviewlyLogo from '../assets/reviewly-logo.png'

export default function Auth() {
  const [searchParams] = useSearchParams()
  const [mode, setMode] = useState(searchParams.get('mode') === 'signin' ? 'signin' : 'signup')
  const [step, setStep] = useState('form')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [otp, setOtp] = useState('')
  const [oauthLoading, setOauthLoading] = useState(null)
  const { user, handleAuthSuccess } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await insforge.auth.signUp({
          email: form.email, password: form.password, name: form.name,
        })
        if (error) throw error
        if (data?.requireEmailVerification) {
          setStep('verify')
          toast.success('Check your email for a verification code!')
        } else if (data?.accessToken) {
          await handleAuthSuccess(data.user, data.accessToken)
          toast.success('Account created! Welcome to Reviewly.')
          navigate('/dashboard')
        }
      } else {
        const { data, error } = await insforge.auth.signInWithPassword({
          email: form.email, password: form.password,
        })
        if (error) {
          if (error.statusCode === 403) { setStep('verify'); toast('Please verify your email first.') }
          else throw error
        } else {
          await handleAuthSuccess(data.user, data.accessToken)
          toast.success('Welcome back!')
          navigate('/dashboard')
        }
      }
    } catch (err) {
      toast.error(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const { data, error } = await insforge.auth.verifyEmail({ email: form.email, otp })
      if (error) throw error
      if (data?.accessToken) await handleAuthSuccess(data.user, data.accessToken)
      toast.success('Email verified! Welcome to Reviewly.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider) {
    setOauthLoading(provider)
    const { error } = await insforge.auth.signInWithOAuth({
      provider, redirectTo: `${window.location.origin}/dashboard`,
    })
    if (error) {
      toast.error(error.message)
      setOauthLoading(null)
    }
}

  return (
    <div className="auth-page">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <button className="back-btn" onClick={() => navigate('/')}>
          <ArrowLeft size={15} /> Back
        </button>

        <div className="auth-logo">
          <div className="auth-logo-icon">
            <img src={reviewlyLogo} alt="Logo" />
          </div>
          <h1>Reviewly</h1>
        </div>

        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
            >
              <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
              <p className="auth-subtitle">
                {mode === 'signup'
                  ? 'Start growing your knowledge tree today'
                  : 'Continue your learning journey'}
              </p>

              <div className="oauth-buttons">
                <button
                  className="oauth-btn"
                  onClick={() => handleOAuth('google')}
                  disabled={!!oauthLoading}
                >
                  {oauthLoading === 'google'
                    ? <span className="spinner" />
                    : <img src="https://www.google.com/favicon.ico" width={15} height={15} alt="" />}
                  Continue with Google
                </button>

                <button
                  className="oauth-btn"
                  onClick={() => handleOAuth('github')}
                  disabled={!!oauthLoading}
                >
                  {oauthLoading === 'github' ? <span className="spinner" /> : null}
                  Continue with GitHub
                </button>
              </div>

              <div className="divider"><span>or</span></div>

              <form onSubmit={handleSubmit} className="auth-form">
                {mode === 'signup' && (
                  <div className="input-group">
                    <User size={15} />
                    <input
                      type="text" name="name" placeholder="Full name"
                      value={form.name} onChange={handleChange} required
                    />
                  </div>
                )}
                <div className="input-group">
                  <Mail size={15} />
                  <input
                    type="email" name="email" placeholder="Email address"
                    value={form.email} onChange={handleChange} required
                  />
                </div>
                <div className="input-group">
                  <Lock size={15} />
                  <input
                    type={showPass ? 'text' : 'password'}
                    name="password" placeholder="Password"
                    value={form.password} onChange={handleChange}
                    required minLength={6}
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>

                <motion.button
                  type="submit" className="btn-primary w-full"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {loading
                    ? <span className="spinner" />
                    : mode === 'signup' ? 'Create Account' : 'Sign In'}
                </motion.button>
              </form>

              <p className="auth-switch">
                {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}
                {' '}
                <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
                  {mode === 'signup' ? 'Sign in' : 'Sign up'}
                </button>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="verify"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
            >
              <h2>Check your email</h2>
              <p className="auth-subtitle">
                We sent a 6-digit code to <strong>{form.email}</strong>
              </p>
              <form onSubmit={handleVerify} className="auth-form">
                <div className="input-group otp-input">
                  <input
                    type="text" placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6} required
                  />
                </div>
                <motion.button
                  type="submit" className="btn-primary w-full"
                  disabled={loading || otp.length !== 6}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {loading ? <span className="spinner" /> : 'Verify Email'}
                </motion.button>
              </form>
              <button className="btn-ghost w-full" onClick={() => setStep('form')} style={{ marginTop: '0.75rem' }}>
                <ArrowLeft size={14} /> Back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}