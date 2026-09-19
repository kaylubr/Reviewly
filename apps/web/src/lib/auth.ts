import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, apiRequest } from './api';

export type User = {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  totalSessions: number;
  totalStudyTimeMinutes: number;
  createdAt: string;
};

export const meQueryKey = ['me'];

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      try {
        const data = await apiRequest<{ user: User }>('/api/auth/me');
        return data.user;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    staleTime: 30_000,
  });
}

export type SignUpInput = {
  email: string;
  password: string;
  username?: string;
};

export function useSignUp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignUpInput) =>
      apiRequest<{ user: User }>('/api/auth/sign-up', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(meQueryKey, data.user);
    },
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiRequest<{ user: User }>('/api/auth/sign-in', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(meQueryKey, data.user);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiRequest<void>('/api/auth/sign-out', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(meQueryKey, null);
      queryClient.clear();
    },
  });
}
