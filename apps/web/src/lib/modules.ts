import type { ExtractedDocumentDto, GenerateResultDto, ModuleDetailDto, ModuleDto } from '@reviewly/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest, apiUpload } from './api';

export const modulesQueryKey = ['modules'];

export function useExtractDocument() {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiUpload<ExtractedDocumentDto>('/api/extract', form);
    },
  });
}

export function useGenerateQuestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) =>
      apiRequest<GenerateResultDto>(`/api/modules/${moduleId}/generate`, { method: 'POST' }),
    onSuccess: (_result, moduleId) => {
      void queryClient.invalidateQueries({ queryKey: modulesQueryKey });
      void queryClient.invalidateQueries({ queryKey: ['modules', moduleId] });
    },
  });
}

export type CreateModuleInput = {
  title: string;
  description?: string;
  content?: string;
  tags?: string[];
};

export function useModules() {
  return useQuery({
    queryKey: modulesQueryKey,
    queryFn: async () => (await apiRequest<{ modules: ModuleDto[] }>('/api/modules')).modules,
  });
}

export function useModule(id: string | undefined) {
  return useQuery({
    queryKey: ['modules', id],
    queryFn: async () => (await apiRequest<{ module: ModuleDetailDto }>(`/api/modules/${id}`)).module,
    enabled: Boolean(id),
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateModuleInput) =>
      apiRequest<{ module: ModuleDto }>('/api/modules', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: modulesQueryKey });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiRequest<void>(`/api/modules/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: modulesQueryKey });
    },
  });
}
