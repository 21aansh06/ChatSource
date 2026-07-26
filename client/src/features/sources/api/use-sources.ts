import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Source } from '@/lib/api/types';

export const SOURCES_QUERY_KEY = ['sources'];

export function useSourcesQuery(notebookId: string) {
  return useQuery({
    queryKey: [...SOURCES_QUERY_KEY, notebookId],
    queryFn: async () => {
      const response = await apiClient.sources.list(notebookId);
      return response.sources;
    },
    enabled: Boolean(notebookId),
    // Polling capability: Polls automatically every 2.5s while any source is PENDING or PROCESSING
    refetchInterval: (query) => {
      const sources = query.state.data;
      if (!sources || sources.length === 0) return false;
      const isIngesting = sources.some(
        (s) => s.status === 'PENDING' || s.status === 'PROCESSING'
      );
      return isIngesting ? 2500 : false;
    },
  });
}

export function useCreateSourceMutation(notebookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.sources.create(notebookId, formData);
      return response.source;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SOURCES_QUERY_KEY, notebookId] });
    },
  });
}

export function useDeleteSourceMutation(notebookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const response = await apiClient.sources.delete(sourceId);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SOURCES_QUERY_KEY, notebookId] });
    },
  });
}
