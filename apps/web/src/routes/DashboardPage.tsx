import { motion } from 'framer-motion';
import { BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ModuleCard } from '../components/ModuleCard';
import { useMe } from '../lib/auth';
import { useModules } from '../lib/modules';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: modules, isPending } = useModules();

  return (
    <div className="page dashboard">
      <div className="dashboard-header">
        <div>
          <h1>
            Good {greeting()}, {user?.username || 'Learner'}
          </h1>
          <p className="subtitle">Pick up where you left off.</p>
        </div>
        <motion.button
          className="btn-primary"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/modules/create')}
        >
          <Plus size={17} /> New Module
        </motion.button>
      </div>

      <div className="section-header">
        <h2>Your Modules</h2>
        <button className="btn-ghost btn-sm" onClick={() => navigate('/modules/create')}>
          <Plus size={14} /> New
        </button>
      </div>

      {isPending ? (
        <div className="modules-grid skeleton-grid">
          {[0, 1, 2].map((key) => (
            <div key={key} className="skeleton-card" />
          ))}
        </div>
      ) : modules && modules.length > 0 ? (
        <div className="modules-grid">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onStudy={() => navigate(`/modules/${module.id}`)}
            />
          ))}
        </div>
      ) : (
        <motion.div className="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="empty-icon">
            <BookOpen size={28} strokeWidth={1.5} />
          </div>
          <h3>No modules yet</h3>
          <p>Upload your notes or create a module to get started</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/modules/create')}
            style={{ marginTop: '0.5rem' }}
          >
            <Plus size={15} /> Create your first module
          </button>
        </motion.div>
      )}
    </div>
  );
}
