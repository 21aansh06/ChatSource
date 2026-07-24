import { env } from './config/env.js';
import { redisConnection } from './infra/redis.js';
import {
  registerAllIngestionHandlers,
  ingestionParseWorker,
  ingestionEmbedWorker,
} from './features/ingestion/queue/ingestion.worker.js';
import { StorageService } from './features/storage/storage.service.js';
import { SupabaseStorageProvider } from './features/storage/providers/supabase.provider.js';

console.log('⚙️  [Worker Process] Initializing Async Worker Daemon...');

StorageService.setProvider(new SupabaseStorageProvider());

// Register pluggable ingestion handlers (PDF, Website, Text)
registerAllIngestionHandlers();

redisConnection.on('connect', () => {
  console.log('⚡ [Worker Process] Successfully connected to Redis for BullMQ orchestration.');
});

console.log('🚀 [Worker Process] Ingestion Queue Workers active (Parse Worker & Embed Worker).');

const shutdown = async () => {
  console.log('🛑 [Worker Process] Shutting down worker process...');
  await ingestionParseWorker.close();
  await ingestionEmbedWorker.close();
  await redisConnection.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('✅ [Worker Process] Worker process ready and listening for BullMQ ingestion jobs.');
