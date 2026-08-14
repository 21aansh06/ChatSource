import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api/client';
import { AskQuestionInput } from '@/lib/api/types';

export const CHAT_SESSIONS_QUERY_KEY = ['chat-sessions'];
export const CHAT_HISTORY_QUERY_KEY = ['chat-history'];

export function useChatSessionsQuery(notebookId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: [...CHAT_SESSIONS_QUERY_KEY, notebookId],
    queryFn: async () => {
      const response = await apiClient.chat.listSessions(notebookId, getToken);
      return response.sessions;
    },
    enabled: Boolean(isLoaded && isSignedIn && notebookId),
  });
}

export function useChatSessionQuery(notebookId: string, sessionId: string | null) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: [...CHAT_HISTORY_QUERY_KEY, notebookId, sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await apiClient.chat.getSessionHistory(notebookId, sessionId, getToken);
      return response.session;
    },
    enabled: Boolean(isLoaded && isSignedIn && notebookId && sessionId),
  });
}

export function useAskQuestionMutation(notebookId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AskQuestionInput) => {
      const response = await apiClient.chat.ask(notebookId, input, getToken);
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [...CHAT_SESSIONS_QUERY_KEY, notebookId] });
      queryClient.invalidateQueries({
        queryKey: [...CHAT_HISTORY_QUERY_KEY, notebookId, data.sessionId],
      });
    },
  });
}
