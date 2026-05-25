import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, BookOpen, Zap, TreeDeciduous, ArrowRight,
  Leaf, Brain, Target, Flame, Users,
} from 'lucide-react'

import heroImage from '../assets/hero-image.png'
import reviewlyLogo from '../assets/reviewly-logo.png'
import speedroundImage from '../assets/speedround-image.svg'
import quiztypeImage from '../assets/quiztype-image.png'
import flashcardImage from '../assets/flashcard-image.svg'
import progressionTrackingImage from '../assets/progression-tracking-image.svg'
import startnowImage from '../assets/startnow-image.png'
import learnMoreIcon from '../assets/learn-more-icon.png'
import learnMoreWhiteIcon from '../assets/learn-more-white-icon.png'

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
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="landing">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.15rem', flex: '1' }}>
          <div className="logo-icon"><img src={reviewlyLogo} alt="reviewly logo" /></div>
          <span>Reviewly</span>
        </div>

        <button className="landing-nav-toggle" onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>

        <div className={`landing-nav-links${menuOpen ? ' open' : ''}`}>
          <a href="#howto">How to</a>
          <a href="#features">Features</a>
          <a href="#modes">Modes</a>
          <a href="#team">Team</a>
          <button className="btn-signin" onClick={() => navigate('/auth?mode=signin')}>Sign In</button>
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
        <div className="features-section-header">
          <h2>Let's Go!:</h2>
          <div>
            Study smarter, not harder. Built for how you actually learn.<br />
            Speed rounds, quizzes, and flashcards all in one place.
          </div>
        </div>
        <div className="features-grid">
          {/* Speed Round */}
          <motion.div className="feat-card feat-white" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} viewport={{ once: true }}>
            <h3><span className="feat-highlight">Speed Round<br />Examination</span></h3>
            <img src={speedroundImage} alt="Speed Round" className="feat-img" />
            <button className="feat-learn" onClick={() => navigate('/auth')}>
              <img src={learnMoreIcon} alt="" /> Learn more
            </button>
          </motion.div>

          {/* Quiz Type */}
          <motion.div className="feat-card feat-lime" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} viewport={{ once: true }}>
            <h3><span className="feat-highlight">Quiz Type<br />Examination</span></h3>
            <img src={quiztypeImage} alt="Quiz Type" className="feat-img" />
            <button className="feat-learn" onClick={() => navigate('/auth')}>
              <img src={learnMoreIcon} alt="" /> Learn more
            </button>
          </motion.div>

          {/* Flashcard */}
          <motion.div className="feat-card feat-dark" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} viewport={{ once: true }}>
            <h3><span className="feat-highlight">Flashcard<br />Game</span></h3>
            <img src={flashcardImage} alt="Flashcard" className="feat-img" />
            <button className="feat-learn feat-learn-white" onClick={() => navigate('/auth')}>
              <img src={learnMoreWhiteIcon} alt="" /> Learn more
            </button>
          </motion.div>

          {/* Progression Tracking */}
          <motion.div className="feat-card feat-white" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} viewport={{ once: true }}>
            <h3><span className="feat-highlight">Progression<br />Tracking</span></h3>
            <img src={progressionTrackingImage} alt="Progression Tracking" className="feat-img" />
            <button className="feat-learn" onClick={() => navigate('/auth')}>
              <img src={learnMoreIcon} alt="" /> Learn more
            </button>
          </motion.div>

          {/* Let's make things happen */}
          <motion.div className="feat-card feat-cta" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} viewport={{ once: true }}>
            <div className="feat-cta-text">
              <h3>Let's make things happen</h3>
              <p>Real students forget 70% of what they study within a day. Reviewly fixes that with smart review sessions that repeat what you need, exactly when you need it.</p>
              <button className="feat-cta-btn" onClick={() => navigate('/auth')}>Start Now!</button>
            </div>
            <img src={startnowImage} alt="Start Now" className="feat-cta-img" />
          </motion.div>
        </div>
    </section>

      {/* ── How to Use ── */}
      <section className="howto-section" id='howto'>
        <div className="howto-section-header">
          <h2>How to use:</h2>
          <div>
            Step-by-Step Guide to Achieving <br />
            Your Dream Score
          </div>
        </div>
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
              <button className='howto-toggle'>
                {openHow === i ? '-' : '+'}
              </button>
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