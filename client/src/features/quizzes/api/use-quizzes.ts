import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api/client';
import { CreateQuizInput, SubmitQuizAttemptInput, Quiz } from '@/lib/api/types';

export const QUIZZES_QUERY_KEY = ['quizzes'];

/**
 * Hook to fetch all quizzes associated with a specific source.
 * Automatically polls every 2 seconds while any quiz is PENDING or GENERATING.
 */
export function useSourceQuizzesQuery(notebookId: string, sourceId: string) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: [...QUIZZES_QUERY_KEY, notebookId, sourceId],
    queryFn: async () => {
      return apiClient.quizzes.listBySource(notebookId, sourceId, getToken);
    },
    enabled: Boolean(isLoaded && isSignedIn && notebookId && sourceId),
    refetchInterval: (query) => {
      const quizzes = query.state.data;
      if (!quizzes || quizzes.length === 0) return false;
      const isGenerating = quizzes.some(
        (q) => q.status === 'PENDING' || q.status === 'GENERATING'
      );
      return isGenerating ? 2000 : false;
    },
  });
}

/**
 * Hook to fetch a specific quiz by ID.
 * Polls every 2 seconds if the quiz is still being generated.
 */
export function useQuizQuery(notebookId: string, quizId: string | null) {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: [...QUIZZES_QUERY_KEY, 'detail', notebookId, quizId],
    queryFn: async () => {
      if (!quizId) return null;
      return apiClient.quizzes.getById(notebookId, quizId, getToken);
    },
    enabled: Boolean(isLoaded && isSignedIn && notebookId && quizId),
    refetchInterval: (query) => {
      const quiz = query.state.data;
      if (!quiz) return false;
      return quiz.status === 'PENDING' || quiz.status === 'GENERATING' ? 2000 : false;
    },
  });
}

/**
 * Mutation hook to trigger asynchronous quiz generation.
 */
export function useGenerateQuizMutation(notebookId: string, sourceId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateQuizInput) => {
      return apiClient.quizzes.generate(notebookId, sourceId, input, getToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUIZZES_QUERY_KEY, notebookId, sourceId],
      });
    },
  });
}

/**
 * Mutation hook to submit answers and grade an attempt.
 */
export function useSubmitQuizAttemptMutation(notebookId: string, quizId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SubmitQuizAttemptInput) => {
      return apiClient.quizzes.submitAttempt(notebookId, quizId, input, getToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUIZZES_QUERY_KEY, 'detail', notebookId, quizId],
      });
    },
  });
}

/**
 * Mutation hook to delete a quiz.
 */
export function useDeleteQuizMutation(notebookId: string, sourceId: string) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quizId: string) => {
      return apiClient.quizzes.delete(notebookId, quizId, getToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...QUIZZES_QUERY_KEY, notebookId, sourceId],
      });
    },
  });
}
