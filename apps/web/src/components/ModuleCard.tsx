import type { ModuleDto } from '@reviewly/shared';
import { motion } from 'framer-motion';
import { ChevronRight, Tag } from 'lucide-react';
import { useNavigate } from 'react-router';

type ModuleCardProps = {
  module: ModuleDto;
  onStudy: () => void;
};

export function ModuleCard({ module, onStudy }: ModuleCardProps) {
  const navigate = useNavigate();
  const mastery = module.masteryScore || 0;
  const masteryColor = mastery >= 80 ? 'var(--lime)' : mastery >= 50 ? 'var(--amber)' : 'var(--crimson)';

  return (
    <motion.div
      className="module-card"
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      onClick={() => navigate(`/modules/${module.id}`)}
    >
      <div className="module-card-header">
        <div
          className="module-status-dot"
          style={{ background: module.aiProcessed ? 'var(--lime)' : 'var(--amber)' }}
        />
        <span className="module-session-count">{module.totalSessions} sessions</span>
      </div>
      <h3 className="module-card-title">{module.title}</h3>
      {module.description && (
        <p className="module-card-desc">
          {module.description.slice(0, 80)}
          {module.description.length > 80 ? '...' : ''}
        </p>
      )}
      {module.tags.length > 0 && (
        <div className="tags-row module-tags">
          {module.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag tag-sm">
              <Tag size={9} /> {tag}
            </span>
          ))}
        </div>
      )}
      <div className="module-mastery">
        <div className="mastery-bar-track">
          <div className="mastery-bar-fill" style={{ width: `${mastery}%`, background: masteryColor }} />
        </div>
        <span className="mastery-label">{mastery}% mastery</span>
      </div>
      <div className="module-card-footer">
        <button
          className="btn-primary btn-sm"
          onClick={(event) => {
            event.stopPropagation();
            onStudy();
          }}
        >
          Study <ChevronRight size={13} />
        </button>
      </div>
    </motion.div>
  );
}
