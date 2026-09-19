import type {
  FlashcardDto,
  McqQuestionDto,
  ReviewMode,
  SessionCompleteDto,
  SessionStatsInput,
} from '@reviewly/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './api';
import { meQueryKey } from './auth';
import { modulesQueryKey } from './modules';
import { sessionsQueryKey } from './sessions';

export type SessionStats = {
  correctAnswers: number;
  totalQuestions: number;
  durationSeconds: number;
};

export type ReviewOutcome = {
  score: number;
  saved: boolean;
  moduleTotalSessions: number | null;
  masteryScore: number | null;
};

export function scoreFor(stats: SessionStats): number {
  return stats.totalQuestions > 0 ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100) : 0;
}

export type ReviewSessionData =
  | { mode: 'flashcard'; flashcards: FlashcardDto[] }
  | { mode: 'mcq' | 'speed'; questions: McqQuestionDto[] };

export function reviewSessionIsEmpty(data: ReviewSessionData): boolean {
  return data.mode === 'flashcard' ? data.flashcards.length === 0 : data.questions.length === 0;
}

export function useReviewSession(moduleId: string | undefined, mode: ReviewMode) {
  return useQuery({
    queryKey: ['review', moduleId, mode],
    queryFn: async (): Promise<ReviewSessionData> => {
      if (mode === 'flashcard') {
        const data = await apiRequest<{ flashcards: FlashcardDto[] }>(
          `/api/modules/${moduleId}/flashcards`,
        );
        return { mode, flashcards: data.flashcards };
      }

      const path =
        mode === 'mcq' ? `/api/modules/${moduleId}/mcq?count=10` : `/api/modules/${moduleId}/speed`;
      const data = await apiRequest<{ questions: McqQuestionDto[] }>(path);

      return { mode, questions: data.questions };
    },
    enabled: Boolean(moduleId),
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SessionStatsInput) =>
      apiRequest<SessionCompleteDto>('/api/sessions/complete', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: meQueryKey });
      void queryClient.invalidateQueries({ queryKey: modulesQueryKey });
      void queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    },
  });
}
