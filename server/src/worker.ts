import { env } from './config/env.js';
import { redisConnection } from './infra/redis.js';
import {
  registerAllIngestionHandlers,
  ingestionParseWorker,
  ingestionEmbedWorker,
} from './features/ingestion/queue/ingestion.worker.js';
import { chatAnswerWorker } from './features/chat/queue/chat.worker.js';

console.log('⚙️  [Worker Process] Initializing Async Worker Daemon...');

// Register pluggable ingestion handlers (PDF, Website, Text)
registerAllIngestionHandlers();

redisConnection.on('connect', () => {
  console.log('⚡ [Worker Process] Successfully connected to Redis for BullMQ orchestration.');
});

console.log('🚀 [Worker Process] Background Workers Active (Parse Worker, Embed Worker, Chat Answer Worker).');

// Graceful shutdown handling for worker daemon process
const shutdown = async () => {
  console.log('🛑 [Worker Process] Shutting down worker process...');
  await ingestionParseWorker.close();
  await ingestionEmbedWorker.close();
  await chatAnswerWorker.close();
  await redisConnection.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('✅ [Worker Process] Worker process ready and listening for BullMQ ingestion & chat jobs.');
