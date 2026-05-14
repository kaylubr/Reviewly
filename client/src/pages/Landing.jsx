import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, BookOpen, Zap, TreeDeciduous, ArrowRight } from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'AI-Powered Quizzes', desc: 'Upload any material and watch AI generate perfect review sessions tailored to your content.' },
  { icon: Zap, title: 'Three Review Modes', desc: 'Flashcards, Multiple Choice, and Speed Rounds — each designed to maximize retention.' },
  { icon: TreeDeciduous, title: 'Grow Your Tree', desc: 'Watch your knowledge tree evolve from a tiny sapling to a mystical ancient tree as you level up.' },
  { icon: Sparkles, title: 'Track Everything', desc: 'Streaks, XP, mastery scores, weekly graphs — all in a beautiful dashboard.' }
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>AI-Powered Learning</span>
          </div>
          <h1>
            Study smarter.<br />
            <span className="gradient-text">Grow your tree.</span>
          </h1>
          <p>
            Upload your notes, let AI generate personalized review sessions, and watch your knowledge tree evolve as you learn.
          </p>
          <div className="hero-cta">
            <motion.button
              className="btn-primary btn-lg"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/auth')}
            >
              Start Growing <ArrowRight size={18} />
            </motion.button>
            <button className="btn-ghost btn-lg" onClick={() => navigate('/auth?mode=signin')}>
              Sign In
            </button>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <TreeVisualization level={12} />
        </motion.div>
      </section>

      {/* Features */}
      <section className="features-section">
        <h2>Everything you need to master any subject</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="feature-icon">
                <f.icon size={24} />
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Review modes */}
      <section className="modes-section">
        <h2>Three ways to learn</h2>
        <div className="modes-grid">
          <ModeCard
            icon="🃏"
            title="Flashcard Mode"
            desc="Flip through AI-generated cards with spaced repetition. Know it or need review — you decide."
            color="var(--emerald)"
          />
          <ModeCard
            icon="🎯"
            title="Multiple Choice"
            desc="AI-crafted questions with instant feedback and explanations. Difficulty scales with your mastery."
            color="var(--violet)"
          />
          <ModeCard
            icon="⚡"
            title="Speed Round"
            desc="Race against the clock. Combos, multipliers, and streak bonuses make it exhilarating."
            color="var(--amber)"
          />
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2>Ready to grow your knowledge tree?</h2>
          <p>Join thousands of learners who've turned studying into an adventure.</p>
          <motion.button
            className="btn-primary btn-lg"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
          >
            Get Started Free <ArrowRight size={18} />
          </motion.button>
        </motion.div>
      </section>
    </div>
  )
}

function ModeCard({ icon, title, desc, color }) {
  return (
    <motion.div
      className="mode-card"
      style={{ '--mode-color': color }}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className="mode-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </motion.div>
  )
}

function TreeVisualization({ level }) {
  const getTreeEmoji = (lv) => {
    if (lv >= 20) return '🌳'
    if (lv >= 15) return '🌸'
    if (lv >= 10) return '🌿'
    if (lv >= 5) return '🪴'
    return '🌱'
  }

  return (
    <div className="hero-tree">
      <div className="tree-glow" />
      <motion.div
        className="tree-emoji"
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        {getTreeEmoji(level)}
      </motion.div>
      <div className="tree-particles">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="particle"
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{
              opacity: [0, 1, 0],
              y: -60 - Math.random() * 40,
              x: (Math.random() - 0.5) * 80
            }}
            transition={{
              repeat: Infinity,
              duration: 2 + Math.random() * 2,
              delay: i * 0.4
            }}
          />
        ))}
      </div>
      <div className="tree-stats">
        <span>✨ Level {level}</span>
        <span>🔥 14-day streak</span>
        <span>📚 47 sessions</span>
      </div>
    </div>
  )
}
