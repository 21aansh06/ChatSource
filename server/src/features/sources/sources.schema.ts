import { z } from 'zod';
import { SourceType } from '@prisma/client';

export const createSourceSchema = z.object({
  title: z.string().min(1, 'Source title is required').max(200).trim(),
  type: z.nativeEnum(SourceType, { errorMap: () => ({ message: 'Invalid source type (PDF, WEBSITE, TEXT)' }) }),
  
  fileKey: z.string().optional(), 
  url: z.string().url('Invalid URL format').optional(),
  rawText: z.string().min(1, 'Raw text cannot be empty').optional(), 
});

export type CreateSourceInput = z.infer<typeof createSourceSchema>;

