import { Redis, RedisOptions } from 'ioredis';
import { env } from '../config/env.js';

/**
 * Factory function creating ioredis instances with automatic Upstash Redis TLS (rediss://)
 * and BullMQ compatibility settings.
 */
export function createRedisClient(extraOptions: RedisOptions = {}): Redis {
  const isTls = env.REDIS_URL.startsWith('rediss://');
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    ...extraOptions,
  });
}

export const redisConnection = createRedisClient();

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err?.message || err);
});
