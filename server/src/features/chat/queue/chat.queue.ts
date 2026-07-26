import { Queue } from 'bullmq';
import { redisConnection, createRedisClient } from '../../../infra/redis.js';

export const CHAT_ANSWER_QUEUE_NAME = 'chat-answer';

export interface ChatAnswerJobData {
  sessionId: string;
  notebookId: string;
  userId: string;
  userMessageId: string;
  userMessage: string;
}

export type ChatStreamEventType = 'token' | 'citations' | 'complete' | 'error';

export interface ChatStreamEvent {
  type: ChatStreamEventType;
  payload: any;
}

/**
 * BullMQ Queue Producer for Async Chat Answer Generation
 */
export const chatAnswerQueue = new Queue<ChatAnswerJobData>(CHAT_ANSWER_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
  },
});

// Dedicated Redis client instance for Pub/Sub publishing
const publisher = createRedisClient();

/**
 * Helper to publish a real-time event to the Redis Pub/Sub channel for a given chat session
 */
export async function publishChatEvent(sessionId: string, event: ChatStreamEvent): Promise<void> {
  const channel = `chat:stream:${sessionId}`;
  await publisher.publish(channel, JSON.stringify(event));
}
