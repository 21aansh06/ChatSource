import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../infra/redis.js';
import { prisma } from '../../../infra/prisma.js';
import { QuizStatus } from '@prisma/client';
import { QUIZ_GENERATION_QUEUE_NAME, QuizGenerationJobData } from './quiz.queue.js';
import { SamplingService } from '../services/sampling.service.js';
import { QuizLLMFactory } from '../llm/quiz-llm.factory.js';

/**
 * BullMQ Worker executing asynchronous quiz generation in the background.
 */
export const quizGenerationWorker = new Worker<QuizGenerationJobData>(
  QUIZ_GENERATION_QUEUE_NAME,
  async (job: Job<QuizGenerationJobData>) => {
    const { quizId, sourceId, userId, questionCount, difficulty, provider } = job.data;
    console.log(`🧠 [QuizWorker] Starting quiz generation for Quiz: ${quizId} (Source: ${sourceId}, Questions: ${questionCount}, Difficulty: ${difficulty})`);

    try {
      // 1. Mark quiz as GENERATING
      await prisma.quiz.update({
        where: { id: quizId },
        data: {
          status: QuizStatus.GENERATING,
          errorMessage: null,
        },
      });

      // 2. Fetch source details and verify ingestion completion
      const source = await prisma.source.findUnique({
        where: { id: sourceId, userId },
        include: {
          chunks: {
            orderBy: { chunkIndex: 'asc' },
          },
        },
      });

      if (!source) {
        throw new Error(`[QuizWorker] Source ${sourceId} not found or user unauthorized.`);
      }

      if (source.chunks.length === 0) {
        throw new Error(`[QuizWorker] Source "${source.title}" has 0 processed chunks.`);
      }

      // 3. Run Stratified Semantic Sampling
      const samplingResult = SamplingService.sampleChunks(source.chunks, questionCount);
      console.log(`📊 [QuizWorker] Sampled ${samplingResult.sampledChunksCount}/${samplingResult.totalChunks} chunks (~${samplingResult.approximateTokens} tokens)`);

      // 4. Resolve LLM Provider via Factory
      const llm = QuizLLMFactory.getProvider(provider);
      console.log(`🤖 [QuizWorker] Using LLM Provider: ${llm.providerName} (model: ${llm.defaultModel})`);

      // 5. Generate structured quiz
      const generated = await llm.generateQuiz({
        sourceTitle: source.title,
        sourceType: source.type,
        sampledContext: samplingResult.assembledPrompt,
        questionCount,
        difficulty,
      });

      // 6. Atomically persist completed quiz
      const updatedQuiz = await prisma.quiz.update({
        where: { id: quizId },
        data: {
          status: QuizStatus.COMPLETED,
          title: generated.quiz.title,
          description: generated.quiz.summary,
          totalQuestions: generated.quiz.questions.length,
          questions: generated.quiz.questions as unknown as object,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ [QuizWorker] Successfully generated Quiz ${quizId}: "${updatedQuiz.title}" with ${generated.quiz.questions.length} questions.`);
      return { success: true, quizId, questionsCount: generated.quiz.questions.length };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown generation error';
      console.error(`❌ [QuizWorker] Failed to generate Quiz ${quizId}:`, error);

      // Persist failure status so client can see the error
      await prisma.quiz.update({
        where: { id: quizId },
        data: {
          status: QuizStatus.FAILED,
          errorMessage: errorMsg,
        },
      }).catch((dbErr) => console.error(`[QuizWorker] Failed to mark quiz as FAILED:`, dbErr));

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);
