import { BookOpen, Clock, Mail, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { StatCard } from '../components/StatCard';
import { useMe } from '../lib/auth';
import { hoursFromMinutes, monthAndYear } from '../lib/format';
import { useUpdateUsername } from '../lib/profile';

export function ProfilePage() {
  const { data: user } = useMe();
  const updateUsername = useUpdateUsername();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (!editing) {
      setUsername(user?.username ?? '');
    }
  }, [user?.username, editing]);

  async function saveUsername() {
    const next = username.trim();

    if (!next) {
      toast.error('Username cannot be empty');
      return;
    }

    try {
      await updateUsername.mutateAsync(next);
      setEditing(false);
      toast.success('Username updated!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update your username');
    }
  }

  const initial = (user?.username || user?.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="page profile-page">
      <h1>Profile</h1>

      <div className="profile-hero">
        <div className="profile-avatar">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" />
          ) : (
            <div className="avatar-placeholder">{initial}</div>
          )}
        </div>

        <div className="profile-info">
          {editing ? (
            <div className="edit-name-row">
              <input
                className="input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={60}
              />
              <button
                className="btn-primary btn-sm"
                onClick={saveUsername}
                disabled={updateUsername.isPending}
              >
                {updateUsername.isPending ? <span className="spinner" /> : 'Save'}
              </button>
              <button className="btn-ghost btn-sm" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          ) : (
            <div className="name-row">
              <h2>{user?.username || 'Learner'}</h2>
              <button className="edit-btn" onClick={() => setEditing(true)}>
                Edit
              </button>
            </div>
          )}
          <p className="profile-email">
            <Mail size={13} /> {user?.email}
          </p>
        </div>
      </div>

      <div className="stats-row">
        <StatCard
          icon={<BookOpen size={18} />}
          label="Sessions"
          value={user?.totalSessions ?? 0}
          color="emerald"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Hours"
          value={hoursFromMinutes(user?.totalStudyTimeMinutes ?? 0)}
          color="sky"
        />
      </div>

      <div className="card profile-meta">
        <User size={13} />
        Member since {monthAndYear(user?.createdAt ?? new Date().toISOString())}
      </div>
    </div>
  );
}
