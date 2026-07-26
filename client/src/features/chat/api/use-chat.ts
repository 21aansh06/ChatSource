import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { AskQuestionInput } from '@/lib/api/types';

export const CHAT_SESSIONS_QUERY_KEY = ['chat-sessions'];
export const CHAT_HISTORY_QUERY_KEY = ['chat-history'];

export function useChatSessionsQuery(notebookId: string) {
  return useQuery({
    queryKey: [...CHAT_SESSIONS_QUERY_KEY, notebookId],
    queryFn: async () => {
      const response = await apiClient.chat.listSessions(notebookId);
      return response.sessions;
    },
    enabled: Boolean(notebookId),
  });
}

export function useChatSessionQuery(notebookId: string, sessionId: string | null) {
  return useQuery({
    queryKey: [...CHAT_HISTORY_QUERY_KEY, notebookId, sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const response = await apiClient.chat.getSessionHistory(notebookId, sessionId);
      return response.session;
    },
    enabled: Boolean(notebookId) && Boolean(sessionId),
  });
}

export function useAskQuestionMutation(notebookId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AskQuestionInput) => {
      const response = await apiClient.chat.ask(notebookId, input);
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
