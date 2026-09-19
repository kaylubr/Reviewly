import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User as UserIcon } from 'lucide-react';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router';
import { useMe, useSignIn, useSignUp } from '../lib/auth';

type Mode = 'signin' | 'signup';

export function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<Mode>(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { data: user } = useMe();
  const signIn = useSignIn();
  const signUp = useSignUp();

  const isSubmitting = signIn.isPending || signUp.isPending;

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      if (mode === 'signup') {
        await signUp.mutateAsync({
          email: form.email,
          password: form.password,
          username: form.username.trim() || undefined,
        });
        toast.success('Account created! Welcome to Reviewly.');
      } else {
        await signIn.mutateAsync({ email: form.email, password: form.password });
        toast.success('Welcome back!');
      }
      navigate('/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
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
            <img src="/assets/reviewly-logo.png" alt="Logo" />
          </div>
          <h1>Reviewly</h1>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
            <p className="auth-subtitle">
              {mode === 'signup' ? 'Create an account to start reviewing' : 'Continue your learning journey'}
            </p>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'signup' && (
                <div className="input-group">
                  <UserIcon size={15} />
                  <input
                    type="text"
                    name="username"
                    placeholder="Full name"
                    value={form.username}
                    onChange={handleChange}
                  />
                </div>
              )}
              <div className="input-group">
                <Mail size={15} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-group">
                <Lock size={15} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword((previous) => !previous)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <motion.button
                type="submit"
                className="btn-primary w-full"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isSubmitting ? <span className="spinner" /> : mode === 'signup' ? 'Create Account' : 'Sign In'}
              </motion.button>
            </form>

            <p className="auth-switch">
              {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => setMode(mode === 'signup' ? 'signin' : 'signup')}>
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
