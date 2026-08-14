import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../infra/redis.js';
import { prisma } from '../../../infra/prisma.js';
import { ChatRole } from '@prisma/client';
import {
  CHAT_ANSWER_QUEUE_NAME,
  ChatAnswerJobData,
  publishChatEvent,
} from './chat.queue.js';
import { RAGService } from '../services/rag.service.js';

/**
 * BullMQ Worker for Async Chat Answer Generation and Real-Time Token Streaming
 */
export const chatAnswerWorker = new Worker<ChatAnswerJobData>(
  CHAT_ANSWER_QUEUE_NAME,
  async (job: Job<ChatAnswerJobData>) => {
    const { sessionId, notebookId, userId, userMessage, sourceIds } = job.data;
    console.log(`🤖 [ChatWorker] Starting async answer generation for session: ${sessionId}${sourceIds?.length ? ` (filtered to ${sourceIds.length} sources)` : ''}`);

    try {
      // Execute RAG pipeline with real-time token streaming callback to Redis Pub/Sub
      const ragResult = await RAGService.answerQuestion(
        userId,
        notebookId,
        userMessage,
        async (token: string) => {
          await publishChatEvent(sessionId, {
            type: 'token',
            payload: { token },
          });
        },
        sourceIds
      );

      // Publish citations event before completing
      if (ragResult.citations.length > 0) {
        await publishChatEvent(sessionId, {
          type: 'citations',
          payload: { citations: ragResult.citations },
        });
      }

      // Atomic Persistence: Save Assistant Message in Prisma
      const assistantMessageRecord = await prisma.chatMessage.create({
        data: {
          sessionId,
          role: ChatRole.ASSISTANT,
          content: ragResult.answer,
          citations: ragResult.citations as any,
        },
      });

      // Update ChatSession timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      // Publish final completion event
      await publishChatEvent(sessionId, {
        type: 'complete',
        payload: {
          assistantMessageId: assistantMessageRecord.id,
          isLowConfidence: ragResult.isLowConfidence,
        },
      });

      console.log(`🎉 [ChatWorker] Successfully completed streaming & persistence for session: ${sessionId}`);
    } catch (err: any) {
      console.error(`❌ [ChatWorker] Error processing job for session ${sessionId}:`, err?.message || err);

      const errorMessage = 'An error occurred while generating the answer. Please try again.';

      // Save failure assistant message in database so session history reflects error
      try {
        await prisma.chatMessage.create({
          data: {
            sessionId,
            role: ChatRole.ASSISTANT,
            content: errorMessage,
          },
        });
      } catch (dbErr) {
        console.error(`[ChatWorker] Failed to save error message to database:`, dbErr);
      }

      // Publish failure event via Redis Pub/Sub to inform client
      await publishChatEvent(sessionId, {
        type: 'error',
        payload: { error: err?.message || errorMessage },
      });

      throw err;
    }
  },
  { connection: redisConnection }
);
