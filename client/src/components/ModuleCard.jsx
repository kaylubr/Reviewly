import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Tag, ChevronRight, Brain, Target } from 'lucide-react'

export default function ModuleCard({ module, onStudy }) {
  const navigate = useNavigate()

  const mastery = module.mastery_score || 0
  const masteryColor = mastery >= 80 ? 'var(--emerald)' : mastery >= 50 ? 'var(--amber)' : 'var(--red)'

  return (
    <motion.div
      className="module-card"
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
      onClick={() => navigate(`/modules/${module.id}`)}
    >
      <div className="module-card-header">
        <div className="module-status-dot" style={{ background: module.ai_processed ? 'var(--emerald)' : 'var(--amber)' }} />
        <span className="module-session-count">{module.total_sessions} sessions</span>
      </div>

      <h3 className="module-card-title">{module.title}</h3>
      {module.description && (
        <p className="module-card-desc">{module.description.slice(0, 80)}{module.description.length > 80 ? '…' : ''}</p>
      )}

      {/* Tags */}
      {module.tags?.length > 0 && (
        <div className="tags-row module-tags">
          {module.tags.slice(0, 3).map(t => (
            <span key={t} className="tag tag-sm"><Tag size={10} /> {t}</span>
          ))}
        </div>
      )}

      {/* Mastery bar */}
      <div className="module-mastery">
        <div className="mastery-bar-track">
          <div
            className="mastery-bar-fill"
            style={{ width: `${mastery}%`, background: masteryColor }}
          />
        </div>
        <span className="mastery-label">{mastery}% mastery</span>
      </div>

      <div className="module-card-footer">
        <button className="btn-primary btn-sm" onClick={e => { e.stopPropagation(); onStudy() }}>
          Study <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}
