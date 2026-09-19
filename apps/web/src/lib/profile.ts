import type { UserDto } from '@reviewly/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from './api';
import { meQueryKey } from './auth';

export function useUpdateUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (username: string) =>
      apiRequest<{ user: UserDto }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ username }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(meQueryKey, data.user);
    },
  });
}
