import { z } from 'zod';

export const queryChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').trim(),
  sessionId: z.string().uuid('Invalid session ID format').optional(),
});

export type QueryChatInput = z.infer<typeof queryChatSchema>;



export const judgeResponseSchema = z.object({
  faithfulnessScore: z.number().min(0.0).max(1.0),
  relevanceScore: z.number().min(0.0).max(1.0),
  reasoning: z.string(),
});

export type JudgeResponse = z.infer<typeof judgeResponseSchema>;


export const queryExpansionSchema = z.object({
  stepBackQuery: z.string(),
  typoCorrectedQuery: z.string(),
  hydePassage: z.string(),
  subQuestions: z.array(z.string()).max(3),
});

export type QueryExpansionResult = z.infer<typeof queryExpansionSchema>;
