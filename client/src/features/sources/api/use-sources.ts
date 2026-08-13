import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api/client';
import { USER_QUERY_KEY } from '@/features/users/api/use-user';

export const SOURCES_QUERY_KEY = ['sources'];

export function useSourcesQuery(notebookId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [...SOURCES_QUERY_KEY, notebookId],
    queryFn: async () => {
      const response = await apiClient.sources.list(notebookId, getToken);
      // Invalidate user usage query to keep sourcesAddedCount fresh in UI
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
      return response.sources;
    },
    enabled: Boolean(isLoaded && isSignedIn && notebookId),
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
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiClient.sources.create(notebookId, formData, getToken);
      return response.source;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SOURCES_QUERY_KEY, notebookId] });
      queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY });
    },
  });
}

export function useDeleteSourceMutation(notebookId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sourceId: string) => {
      const response = await apiClient.sources.delete(sourceId, getToken);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SOURCES_QUERY_KEY, notebookId] });
    },
  });
}
