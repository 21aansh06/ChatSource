import { env } from './config/env.js';
import { redisConnection } from './infra/redis.js';

console.log('⚙️  [Worker Process] Initializing Async Worker Daemon...');

redisConnection.on('connect', () => {
  console.log('⚡ [Worker Process] Successfully connected to Redis for BullMQ orchestration.');
});

const shutdown = async () => {
  console.log('🛑 [Worker Process] Shutting down worker process...');
  await redisConnection.quit();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('✅ [Worker Process] Worker process ready and standing by for BullMQ job queues.');
