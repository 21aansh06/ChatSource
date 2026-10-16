import { redisConnection } from './infra/redis.js';
import {
  registerAllIngestionHandlers,
  ingestionParseWorker,
  ingestionEmbedWorker,
} from './features/ingestion/queue/ingestion.worker.js';
import { chatAnswerWorker } from './features/chat/queue/chat.worker.js';
import { quizGenerationWorker } from './features/quizzes/queue/quiz.worker.js';

export async function startWorkers() {
  console.log('⚙️ [Worker] Initializing...');

  registerAllIngestionHandlers();

  redisConnection.on('connect', () => {
    console.log('⚡ [Worker] Connected to Redis.');
  });

  console.log('🚀 [Worker] Parse, Embed, Chat, and Quiz workers started.');
}

export async function stopWorkers() {
  console.log('🛑 [Worker] Shutting down...');

  await ingestionParseWorker.close();
  await ingestionEmbedWorker.close();
  await chatAnswerWorker.close();
  await quizGenerationWorker.close();
  await redisConnection.quit();
}