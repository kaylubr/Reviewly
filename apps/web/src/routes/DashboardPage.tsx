import type { SessionHistoryDto } from '@reviewly/shared';
import { motion } from 'framer-motion';
import { BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { ModuleCard } from '../components/ModuleCard';
import { StatCard } from '../components/StatCard';
import { useMe } from '../lib/auth';
import { formatDate, hoursFromMinutes } from '../lib/format';
import { useModules } from '../lib/modules';
import { MODE_COLORS, useSessionHistory } from '../lib/sessions';

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
}

function SessionRow({ session }: { session: SessionHistoryDto }) {
  return (
    <div className="session-row">
      <span
        className="mode-badge"
        style={{
          borderLeft: `3px solid ${MODE_COLORS[session.mode] ?? 'var(--border)'}`,
          paddingLeft: '0.5rem',
        }}
      >
        {session.mode}
      </span>
      <span className="session-module">{session.moduleTitle ?? 'Unknown'}</span>
      <span className="session-score">{session.score}%</span>
      <span className="session-date">{formatDate(session.completedAt)}</span>
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: user } = useMe();
  const { data: modules, isPending } = useModules();
  const { data: sessions } = useSessionHistory(5);

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

      <div className="stats-row">
        <StatCard
          icon={<img src="/assets/stat_card/Sessions.svg" alt="" width={28} height={28} />}
          label="Sessions"
          value={user?.totalSessions ?? 0}
        />
        <StatCard
          icon={<img src="/assets/stat_card/StudyTime.svg" alt="" width={28} height={28} />}
          label="Study Time"
          value={hoursFromMinutes(user?.totalStudyTimeMinutes ?? 0)}
          suffix="hrs"
        />
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
          <p>Create a module from your notes to get started</p>
          <button
            className="btn-primary"
            onClick={() => navigate('/modules/create')}
            style={{ marginTop: '0.5rem' }}
          >
            <Plus size={15} /> Create your first module
          </button>
        </motion.div>
      )}

      {sessions && sessions.length > 0 && (
        <>
          <div className="section-header">
            <h2>Recent Sessions</h2>
            <button className="btn-ghost btn-sm" onClick={() => navigate('/analytics')}>
              View all
            </button>
          </div>
          <div className="sessions-list">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
