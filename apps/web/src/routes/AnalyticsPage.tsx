import { motion } from 'framer-motion';
import { BookOpen, Target } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { useMe } from '../lib/auth';
import { formatDuration, hoursFromMinutes, shortDate } from '../lib/format';
import { useModules } from '../lib/modules';
import { useSessionHistory } from '../lib/sessions';

const MASTERY_MODULE_LIMIT = 8;

function masteryLevel(score: number): string {
  if (score >= 80) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

export function AnalyticsPage() {
  const { data: user } = useMe();
  const { data: sessions, isPending: sessionsPending } = useSessionHistory();
  const { data: modules } = useModules();

  const modeCount = (sessions ?? []).reduce<Record<string, number>>((totals, session) => {
    totals[session.mode] = (totals[session.mode] ?? 0) + 1;
    return totals;
  }, {});

  const modeData = [
    { name: 'Flashcard', value: modeCount.flashcard ?? 0, fill: 'var(--lime)' },
    { name: 'MCQ', value: modeCount.mcq ?? 0, fill: 'var(--violet)' },
    { name: 'Speed', value: modeCount.speed ?? 0, fill: 'var(--amber)' },
  ];

  const averageScore =
    sessions && sessions.length > 0
      ? Math.round(sessions.reduce((total, session) => total + session.score, 0) / sessions.length)
      : 0;

  const masteryModules = (modules ?? []).slice(0, MASTERY_MODULE_LIMIT);

  return (
    <div className="page analytics-page">
      <h1>Analytics</h1>
      <p className="subtitle">Track your progress across modules and review modes.</p>

      <div className="stats-row">
        <StatCard icon={<Target size={28} />} label="Avg Score" value={`${averageScore}%`} />
        <StatCard
          icon={<img src="/assets/stat_card/StudyTime.svg" alt="" width={28} height={28} />}
          label="Study Time"
          value={`${hoursFromMinutes(user?.totalStudyTimeMinutes ?? 0)}h`}
        />
      </div>

      <div className="analytics-grid">
        <div className="card chart-card-lg">
          <div className="card-header">
            <h3>
              <BookOpen size={16} /> Session Modes
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={modeData} barSize={30}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Sessions">
                {modeData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {masteryModules.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3>
              <Target size={16} /> Module Mastery
            </h3>
          </div>
          <div className="mastery-list">
            {masteryModules.map((module, index) => (
              <motion.div
                key={module.id}
                className="mastery-row"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <span className="mastery-title">{module.title}</span>
                <div className="mastery-bar-track">
                  <motion.div
                    className={`mastery-bar-fill mastery-${masteryLevel(module.masteryScore)}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${module.masteryScore}%` }}
                    transition={{ delay: index * 0.05 + 0.3, duration: 0.8 }}
                  />
                </div>
                <span className="mastery-pct">{module.masteryScore}%</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>
            <BookOpen size={16} /> Session History
          </h3>
        </div>
        {sessionsPending ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <span className="spinner" />
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <p className="empty-text">No sessions yet. Start reviewing!</p>
        ) : (
          <div className="session-table">
            <div className="session-table-header">
              <span>Mode</span>
              <span>Module</span>
              <span>Score</span>
              <span>Duration</span>
              <span>Date</span>
            </div>
            {sessions.map((session) => (
              <div key={session.id} className="session-table-row">
                <span className="mode-badge">{session.mode}</span>
                <span className="session-module-name">{session.moduleTitle ?? '—'}</span>
                <span
                  className={`score-cell ${
                    session.score >= 80 ? 'good' : session.score >= 60 ? 'ok' : 'low'
                  }`}
                >
                  {session.score}%
                </span>
                <span>{formatDuration(session.durationSeconds)}</span>
                <span className="date-cell">{shortDate(session.completedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
