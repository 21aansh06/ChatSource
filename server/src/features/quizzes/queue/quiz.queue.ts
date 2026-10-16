import { Queue } from 'bullmq';
import { redisConnection } from '../../../infra/redis.js';
import { QuizDifficulty } from '../schemas/quiz.schema.js';

export const QUIZ_GENERATION_QUEUE_NAME = 'quiz-generation';

export interface QuizGenerationJobData {
  quizId: string;
  sourceId: string;
  notebookId: string;
  userId: string;
  questionCount: number;
  difficulty: QuizDifficulty;
  provider?: string;
}

/**
 * BullMQ Queue Producer for Asynchronous Quiz Generation
 */
export const quizGenerationQueue = new Queue<QuizGenerationJobData>(QUIZ_GENERATION_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
