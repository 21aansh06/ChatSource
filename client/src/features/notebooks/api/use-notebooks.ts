import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { CreateNotebookInput, UpdateNotebookInput } from '@/lib/api/types';

export const NOTEBOOKS_QUERY_KEY = ['notebooks'];

export function useNotebooksQuery() {
  return useQuery({
    queryKey: NOTEBOOKS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiClient.notebooks.list();
      return response.notebooks;
    },
  });
}

export function useNotebookQuery(notebookId: string) {
  return useQuery({
    queryKey: [...NOTEBOOKS_QUERY_KEY, notebookId],
    queryFn: async () => {
      const response = await apiClient.notebooks.getById(notebookId);
      return response.notebook;
    },
    enabled: Boolean(notebookId),
  });
}

export function useCreateNotebookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNotebookInput) => {
      const response = await apiClient.notebooks.create(input);
      return response.notebook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTEBOOKS_QUERY_KEY });
    },
  });
}

export function useUpdateNotebookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: UpdateNotebookInput }) => {
      const response = await apiClient.notebooks.update(id, input);
      return response.notebook;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: NOTEBOOKS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: [...NOTEBOOKS_QUERY_KEY, variables.id] });
    },
  });
}

export function useDeleteNotebookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.notebooks.delete(id);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTEBOOKS_QUERY_KEY });
    },
  });
}
