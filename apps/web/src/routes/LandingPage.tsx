import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';

const HOW_TO = [
  { num: '01', title: 'Upload your study material',     desc: 'Paste notes or upload a PDF. Our AI will extract all key concepts automatically.' },
  { num: '02', title: 'AI generates your review session', desc: 'Flashcards, MCQ questions, and speed rounds are created in seconds from your content.' },
  { num: '03', title: 'Review and earn XP',             desc: 'Complete sessions to earn experience points, build streaks, and master your material.' },
  { num: '04', title: 'Watch your tree grow',           desc: 'Level up to unlock new tree forms — a visual representation of your growing knowledge.' },
  { num: '05', title: 'Track your progress',            desc: 'Analytics show mastery per module, weekly XP, session history and more.' },
  { num: '06', title: 'Keep the streak alive',          desc: 'Daily streaks give bonus XP multipliers. Consistency is the key to mastery.' },
]

const TEAM = [
  { name: 'Cajigal, Vincent James', role: 'Backend Developer',                  desc: 'Architected the core review engine and built the full-stack infrastructure that powers Reviewly.', linkedin: '#' },
  { name: 'Corpus, Daniel Louis',   role: 'UI/UX Designer',                     desc: 'Designed and built the user interface, making sure every interaction feels smooth and intuitive.', linkedin: '#' },
  { name: 'Punzalan, Bren Carl',    role: 'Backend Developer',                  desc: 'Handles the AI integration and data pipeline that turns uploaded notes into smart review sessions.', linkedin: '#' },
  { name: 'Reyes, Kyle Benedict',   role: 'Frontend Developer/Backend Developer', desc: 'Crafted the visual identity and user experience from the ground up, keeping things clean and focused.', linkedin: 'https://www.linkedin.com/in/kylebreyes/' },
  { name: 'Roxas, Joseph',          role: 'Frontend Developer',                 desc: 'Keeps the team aligned and makes sure Reviewly solves real problems that students actually face.', linkedin: '#' },
]

export function LandingPage() {
  const navigate = useNavigate()
  const [openHow, setOpenHow] = useState<number | null>(null)

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.15rem', flex: '1' }}>
          <div className="logo-icon"><img src="/assets/reviewly-logo.png" alt="reviewly logo" /></div>
          <span>Reviewly</span>
        </div>
        <div className="landing-nav-links">
          <a href="#howto">How to</a>
          <a href="#features">Features</a>
          <a href="#team">Team</a>
          <button className="btn-signin" onClick={() => navigate('/auth?mode=signin')}>Sign In</button>
          <button className="btn-login" onClick={() => navigate('/auth')}>Login</button>
        </div>
      </nav>

      <section className="hero">
        <motion.div className="hero-content" initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1>Reviewly the<br />Friendly AI<br />Powered Reviewer.</h1>
          <p>
            Most students study by reading the same notes over and over, hoping something sticks. It rarely does.
            Reviewly takes a different approach. Upload your notes or study material, and we turn it into
            personalized review sessions that actually test you. Whether you want quick-fire speed rounds,
            structured quizzes, or classic flashcards, Reviewly has a mode for the way you learn.
          </p>
          <div className="hero-cta">
            <motion.button className="hero-cta-button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/auth')}>
              Start an exam
            </motion.button>
          </div>
        </motion.div>
        <img src="/assets/hero-image.png" alt="Hero image" />
      </section>

      <section className="features-section" id="features">
        <div className="features-section-header">
          <h2>Let&apos;s Go!:</h2>
          <div>Study smarter, not harder. Built for how you actually learn.<br />Speed rounds, quizzes, and flashcards all in one place.</div>
        </div>
        <div className="features-grid">
          <motion.div className="feat-card feat-white" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} viewport={{ once: true }}>
            <h3><span className="feat-highlight">Speed Round<br />Examination</span></h3>
            <img src="/assets/speedround-image.svg" alt="Speed Round" className="feat-img" />
            <button className="feat-learn" onClick={() => navigate('/auth')}><img src="/assets/learn-more-icon.png" alt="" /> Learn more</button>
          </motion.div>
          <motion.div className="feat-card feat-lime" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} viewport={{ once: true }}>
            <h3><span className="feat-highlight">Quiz Type<br />Examination</span></h3>
            <img src="/assets/quiztype-image.png" alt="Quiz Type" className="feat-img" />
            <button className="feat-learn" onClick={() => navigate('/auth')}><img src="/assets/learn-more-icon.png" alt="" /> Learn more</button>
          </motion.div>
          <motion.div className="feat-card feat-dark" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} viewport={{ once: true }}>
            <h3><span className="feat-highlight">Flashcard<br />Game</span></h3>
            <img src="/assets/flashcard-image.svg" alt="Flashcard" className="feat-img" />
            <button className="feat-learn feat-learn-white" onClick={() => navigate('/auth')}><img src="/assets/learn-more-white-icon.png" alt="" /> Learn more</button>
          </motion.div>
          <motion.div className="feat-card feat-white" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} viewport={{ once: true }}>
            <h3><span className="feat-highlight">Progression<br />Tracking</span></h3>
            <img src="/assets/progression-tracking-image.svg" alt="Progression Tracking" className="feat-img" />
            <button className="feat-learn" onClick={() => navigate('/auth')}><img src="/assets/learn-more-icon.png" alt="" /> Learn more</button>
          </motion.div>
          <motion.div className="feat-card feat-cta" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }} viewport={{ once: true }}>
            <div className="feat-cta-text">
              <h3>Let&apos;s make things happen</h3>
              <p>Real students forget 70% of what they study within a day. Reviewly fixes that with smart review sessions that repeat what you need, exactly when you need it.</p>
              <button className="feat-cta-btn" onClick={() => navigate('/auth')}>Start Now!</button>
            </div>
            <img src="/assets/startnow-image.png" alt="Start Now" className="feat-cta-img" />
          </motion.div>
        </div>
      </section>

      <section className="howto-section" id="howto">
        <div className="howto-section-header">
          <h2>How to use:</h2>
          <div>Step-by-Step Guide to Achieving <br />Your Dream Score</div>
        </div>
        <div className="howto-list">
          {HOW_TO.map((item, i) => (
            <div key={item.num} className={`howto-item ${openHow === i ? 'open' : ''}`} onClick={() => setOpenHow(openHow === i ? null : i)}>
              <span className="howto-num">{item.num}</span>
              <div>
                <h4>{item.title}</h4>
                {openHow === i && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: '0.4rem' }}>
                    {item.desc}
                  </motion.p>
                )}
              </div>
              <button className="howto-toggle">{openHow === i ? '-' : '+'}</button>
            </div>
          ))}
        </div>
      </section>

      <section className="team-section" id="team">
        <div className="team-header">
          <h2>Team</h2>
          <div>Meet the students behind Reviewly —<br />built out of frustration with bad study habits.</div>
        </div>
        <div className="team-grid">
          {TEAM.map(member => (
            <div key={member.name} className="team-card">
              <div className="team-card-top">
                <div className="team-info">
                  <h4>{member.name}</h4>
                  <p className="team-role">{member.role}</p>
                </div>
                <a href={member.linkedin} className="team-linkedin" target="_blank" rel="noreferrer">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" fill="white" />
                  </svg>
                </a>
              </div>
              <hr className="team-divider" />
              <p className="team-desc">{member.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section" id="about">
        <div className="about-inner">
          <div className="about-text">
            <h2>About us</h2>
            <p>Reviewly is a school project. Five computer science students, all tired of the same problem — spending hours reviewing notes the night before an exam and still blanking out when it mattered. We figured there had to be a better way.</p>
            <p style={{ marginTop: '1rem' }}>So we built one. Reviewly turns your own notes into structured review sessions that actually test you instead of just letting you re-read the same lines. Speed rounds when you&apos;re short on time. Quizzes when you want to go deep. Flashcards when you just need to drill. All generated from whatever you upload.</p>
            <p style={{ marginTop: '1rem' }}>We&apos;re just five people who wanted to study smarter and thought other students might want the same thing.</p>
          </div>
          <div className="about-visual">
            <img src="/assets/about-us-image.png" alt="About us image" />
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-inner">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2>Ready to grow your knowledge tree?</h2>
            <p>Join learners who&apos;ve turned studying into an adventure.</p>
            <motion.button className="btn-primary btn-lg" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/auth')}>
              Get Started Free <ArrowRight size={17} />
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
