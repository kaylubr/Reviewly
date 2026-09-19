import type { ReactNode } from 'react';

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  suffix?: string;
  color?: string;
};

export function StatCard({ icon, label, value, suffix, color }: StatCardProps) {
  return (
    <div className={color ? `stat-card stat-${color}` : 'stat-card'}>
      <div className="stat-icon">{icon}</div>
      <div>
        <p className="stat-label">{label}</p>
        <p className="stat-value">
          {value}
          {suffix && <span className="stat-suffix"> {suffix}</span>}
        </p>
      </div>
    </div>
  );
}
