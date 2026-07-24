import { Queue } from 'bullmq';
import { redisConnection } from '../../../infra/redis.js';
export const INGESTION_PARSE_QUEUE_NAME = 'ingestion-parse';
export const INGESTION_EMBED_QUEUE_NAME = 'ingestion-embed';
export interface IngestionParseJobData {
  sourceId: string;
}
export interface IngestionEmbedJobData {
  sourceId: string;
}
/**
 * BullMQ Queue Producers.
 * Topology rationale:
 * 1. ingestionParseQueue: Handles CPU-heavy parsing, OCR, and DOM cleaning.
 * 2. ingestionEmbedQueue: Handles I/O-bound vector embedding generation & Qdrant network calls.
 * Separating queues prevents CPU-bound parsing from starving I/O embedding tasks.
 */
export const ingestionParseQueue = new Queue<IngestionParseJobData>(INGESTION_PARSE_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
});
export const ingestionEmbedQueue = new Queue<IngestionEmbedJobData>(INGESTION_EMBED_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
  },
});


export async function enqueueSourceIngestion(sourceId: string): Promise<void> {
  await ingestionParseQueue.add(
    'parse-source',
    { sourceId },
    { jobId: `parse-${sourceId}` } 
  );
  console.log(`[IngestionQueue] Enqueued source ${sourceId} to ${INGESTION_PARSE_QUEUE_NAME}`);
}
