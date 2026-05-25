import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, BookOpen, Zap, TreeDeciduous, ArrowRight,
  Leaf, ChevronDown, Brain, Target, Flame, Users, Star
} from 'lucide-react'

import heroImage from '../assets/hero-image.png'
import reviewlyLogo from '../assets/reviewly-logo.png'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Quizzes',
    desc: 'Upload any material and watch AI generate perfect review sessions tailored to your content.',
  },
  {
    icon: Zap,
    title: 'Three Review Modes',
    desc: 'Flashcards, Multiple Choice, and Speed Rounds — each designed to maximize retention.',
  },
  {
    icon: TreeDeciduous,
    title: 'Grow Your Tree',
    desc: 'Watch your knowledge tree evolve from a tiny sapling to a mystical ancient tree as you level up.',
  },
  {
    icon: Sparkles,
    title: 'Track Everything',
    desc: 'Streaks, XP, mastery scores, weekly graphs — all in a beautiful dashboard.',
  },
]

const HOW_TO = [
  {
    num: '01',
    title: 'Upload your study material',
    desc: 'Paste notes or upload a PDF. Our AI will extract all key concepts automatically.',
  },
  {
    num: '02',
    title: 'AI generates your review session',
    desc: 'Flashcards, MCQ questions, and speed rounds are created in seconds from your content.',
  },
  {
    num: '03',
    title: 'Review and earn XP',
    desc: 'Complete sessions to earn experience points, build streaks, and master your material.',
  },
  {
    num: '04',
    title: 'Watch your tree grow',
    desc: 'Level up to unlock new tree forms — a visual representation of your growing knowledge.',
  },
  {
    num: '05',
    title: 'Track your progress',
    desc: 'Analytics show mastery per module, weekly XP, session history and more.',
  },
  {
    num: '06',
    title: 'Keep the streak alive',
    desc: 'Daily streaks give bonus XP multipliers. Consistency is the key to mastery.',
  },
]

const MODES = [
  { icon: BookOpen, title: 'Flashcard Mode', desc: 'Flip through AI-generated cards. Know it or need review — you decide the pace.' },
  { icon: Target,   title: 'Multiple Choice', desc: 'AI-crafted questions with instant feedback and explanations that stick.' },
  { icon: Zap,      title: 'Speed Round', desc: 'Race the clock. Combo multipliers and streak bonuses make every second count.' },
]

const TEAM = [
  { initials: 'JR', name: 'Juan Reyes', role: 'Lead Developer', desc: 'Architected the AI integration and review engine.' },
  { initials: 'ML', name: 'Maria Lim', role: 'UI/UX Designer', desc: 'Designed the interface and knowledge tree system.' },
  { initials: 'AK', name: 'Anton Ko', role: 'Backend Engineer', desc: 'Built the scoring, XP, and achievement systems.' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [openHow, setOpenHow] = useState(null)

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.15rem', flex: '1' }}>
          <div className="logo-icon"><img src={reviewlyLogo} alt="reviewly logo" /></div>
          <span>Reviewly</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          <a href="#features" style={{ color: 'inherit', transition: 'color 0.15s' }}>Features</a>
          <a href="#modes" style={{ color: 'inherit', transition: 'color 0.15s' }}>Modes</a>
          <a href="#team" style={{ color: 'inherit', transition: 'color 0.15s' }}>Team</a>
          <button className='btn-signin' onClick={() => navigate('/auth?mode=signin')}>Sign In</button>
          <button className="btn-login" onClick={() => navigate('/auth')}>Login</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="hero-badge">
            <Sparkles size={13} strokeWidth={2.5} />
            AI-Powered Learning
          </div>

          <h1>
            Reviewly the<br />
            Friendly AI<br />
            Powered Reviewer.
          </h1>

          <p>
            Upload your notes, let AI generate personalized review sessions, and watch
            your knowledge tree evolve as you learn.
          </p>

          <div className="hero-cta">
            <motion.button
              className="btn-primary btn-lg"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth')}
            >
              Start Growing <ArrowRight size={17} />
            </motion.button>
            <button
              className="btn-ghost btn-lg"
              onClick={() => navigate('/auth?mode=signin')}
            >
              Sign In
            </button>
          </div>
        </motion.div>

        <img src={heroImage} alt="Hero image" />
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <h2>Everything you need to master any subject</h2>
        <p className="features-subtitle">One platform. Three modes. Infinite progress.</p>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              viewport={{ once: true }}
            >
              <div className="feature-icon">
                <f.icon size={22} strokeWidth={2} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How to Use ── */}
      <section className="howto-section">
        <h2>How to use</h2>
        <div className="howto-list">
          {HOW_TO.map((item, i) => (
            <div
              key={item.num}
              className={`howto-item ${openHow === i ? 'open' : ''}`}
              onClick={() => setOpenHow(openHow === i ? null : i)}
            >
              <span className="howto-num">{item.num}</span>
              <div>
                <h4>{item.title}</h4>
                {openHow === i && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ marginTop: '0.4rem' }}
                  >
                    {item.desc}
                  </motion.p>
                )}
              </div>
              <ChevronDown size={18} className="howto-chevron" />
            </div>
          ))}
        </div>
      </section>

      {/* ── Review Modes (dark) ── */}
      <section className="modes-section" id="modes">
        <div className="modes-inner">
          <h2>Three ways to learn</h2>
          <p className="modes-subtitle">Every mode built to maximise retention and engagement.</p>
          <div className="modes-grid">
            {MODES.map((m, i) => (
              <motion.div
                key={m.title}
                className="mode-card"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
              >
                <div className="mode-icon">
                  <m.icon size={20} strokeWidth={2} />
                </div>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="team-section" id="team">
        <h2>Team</h2>
        <div className="team-grid">
          {TEAM.map(member => (
            <div key={member.name} className="team-card">
              <div className="team-avatar">{member.initials}</div>
              <div>
                <h4>{member.name}</h4>
                <p>{member.role}</p>
                <p className="team-desc">{member.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── About ── */}
      <section className="about-section">
        <div className="about-inner">
          <div className="about-text">
            <h2>About us</h2>
            <p>
              Reviewly was built by students, for students. We believe learning should
              be engaging, measurable, and even a little addictive. By combining AI-generated
              content with game-like progression, we've created a tool that makes consistent
              study effortless and rewarding.
            </p>
            <p style={{ marginTop: '1rem' }}>
              Our mission: help every learner turn passive notes into active mastery — one
              session at a time.
            </p>
            <div className="about-cta">
              <button
                className="btn-primary btn-lg"
                style={{ background: 'var(--lime)', color: 'var(--ink)' }}
                onClick={() => navigate('/auth')}
              >
                Get Started Free <ArrowRight size={17} />
              </button>
            </div>
          </div>
          <div className="about-visual">
            <TreeDeciduous size={80} strokeWidth={1.2} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div className="cta-inner">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2>Ready to grow your knowledge tree?</h2>
            <p>Join learners who've turned studying into an adventure.</p>
            <motion.button
              className="btn-primary btn-lg"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth')}
            >
              Get Started Free <ArrowRight size={17} />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}