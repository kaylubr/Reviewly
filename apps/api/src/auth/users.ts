import { users } from '../db/schema';

export const publicUserColumns = {
  id: users.id,
  email: users.email,
  username: users.username,
  avatarUrl: users.avatarUrl,
  totalSessions: users.totalSessions,
  totalStudyTimeMinutes: users.totalStudyTimeMinutes,
  createdAt: users.createdAt,
};

export type PublicUser = {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  totalSessions: number;
  totalStudyTimeMinutes: number;
  createdAt: Date;
};
