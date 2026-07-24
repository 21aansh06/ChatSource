import { z } from 'zod';

export const createNotebookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters').trim(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
});

export const updateNotebookSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title cannot exceed 150 characters').trim().optional(),
  description: z.string().max(500, 'Description cannot exceed 500 characters').trim().optional(),
});

export const notebookParamSchema = z.object({
  id: z.string().uuid('Invalid notebook ID format'),
});

export type CreateNotebookInput = z.infer<typeof createNotebookSchema>;
export type UpdateNotebookInput = z.infer<typeof updateNotebookSchema>;
