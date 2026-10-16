import { z } from 'zod';

export const QuizDifficultyEnum = z.enum(['EASY', 'MEDIUM', 'HARD']);
export type QuizDifficulty = z.infer<typeof QuizDifficultyEnum>;

export const QuizStatusEnum = z.enum(['PENDING', 'GENERATING', 'COMPLETED', 'FAILED']);
export type QuizStatus = z.infer<typeof QuizStatusEnum>;

/**
 * Schema for an individual question within the generated quiz.
 */
export const quizQuestionSchema = z.object({
  id: z.string().describe('Unique identifier for this question (e.g. UUID)'),
  question: z.string().min(5).describe('The question text testing active recall'),
  options: z
    .array(z.string().min(1))
    .length(4)
    .describe('Exactly 4 distinct choices (A, B, C, D)'),
  correctOptionIndex: z
    .number()
    .int()
    .min(0)
    .max(3)
    .describe('0-indexed pointer to the single correct option in options array'),
  explanation: z
    .string()
    .min(10)
    .describe('Detailed educational explanation of why the correct option is right and distractors are wrong'),
  locationHint: z
    .string()
    .optional()
    .describe('Citation pointer back to the source (e.g. "Page 12", "Timestamp 14:30", "Section: Architecture")'),
  difficulty: QuizDifficultyEnum.default('MEDIUM'),
});
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;

/**
 * Top-level contract returned by the LLM Structured Outputs.
 */
export const generatedQuizSchema = z.object({
  title: z.string().min(3).describe('Concise, relevant title for the quiz'),
  summary: z.string().describe('1-2 sentence overview of the covered themes in this quiz'),
  questions: z
    .array(quizQuestionSchema)
    .min(1)
    .max(15)
    .describe('Array of strictly formatted multiple-choice questions'),
});
export type GeneratedQuiz = z.infer<typeof generatedQuizSchema>;

/**
 * Input DTO when requesting quiz generation.
 */
export const createQuizInputSchema = z.object({
  questionCount: z.coerce.number().int().min(3).max(15).default(5),
  difficulty: QuizDifficultyEnum.default('MEDIUM'),
  provider: z.enum(['openai', 'gemini']).optional(),
});
export type CreateQuizInput = z.infer<typeof createQuizInputSchema>;

/**
 * Input DTO when submitting user answers to grade an attempt.
 */
export const submitQuizAttemptSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(0).max(3)),
  timeSpentSec: z.number().int().min(0).optional(),
});
export type SubmitQuizAttemptInput = z.infer<typeof submitQuizAttemptSchema>;
