import { redisConnection } from './infra/redis.js';
import {
  registerAllIngestionHandlers,
  ingestionParseWorker,
  ingestionEmbedWorker,
} from './features/ingestion/queue/ingestion.worker.js';
import { chatAnswerWorker } from './features/chat/queue/chat.worker.js';

export async function startWorkers() {
  console.log('⚙️ [Worker] Initializing...');

  registerAllIngestionHandlers();

  redisConnection.on('connect', () => {
    console.log('⚡ [Worker] Connected to Redis.');
  });

  console.log('🚀 [Worker] Parse, Embed and Chat workers started.');
}

export async function stopWorkers() {
  console.log('🛑 [Worker] Shutting down...');

  await ingestionParseWorker.close();
  await ingestionEmbedWorker.close();
  await chatAnswerWorker.close();
  await redisConnection.quit();
}