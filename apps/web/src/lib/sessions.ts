import type { SessionHistoryDto } from '@reviewly/shared';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from './api';

export const sessionsQueryKey = ['sessions'];

export function useSessionHistory(limit?: number) {
  return useQuery({
    queryKey: [...sessionsQueryKey, limit ?? 'all'],
    queryFn: async () => {
      const path = limit ? `/api/sessions/history?limit=${limit}` : '/api/sessions/history';
      const data = await apiRequest<{ sessions: SessionHistoryDto[] }>(path);
      return data.sessions;
    },
  });
}

export const MODE_COLORS: Record<string, string> = {
  flashcard: 'var(--lime-dark)',
  mcq: 'var(--violet)',
  speed: 'var(--amber)',
};
