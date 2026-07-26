import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../../infra/redis.js';
import { prisma } from '../../../infra/prisma.js';
import { IngestionStatus } from '@prisma/client';
import { IngestionRegistry } from '../contract/ingestion.registry.js';
import { PDFIngestionHandler } from '../handlers/pdf.handler.js';
import { WebsiteIngestionHandler } from '../handlers/website.handler.js';
import { TextIngestionHandler } from '../handlers/text.handler.js';
import {
  INGESTION_PARSE_QUEUE_NAME,
  INGESTION_EMBED_QUEUE_NAME,
  IngestionParseJobData,
  IngestionEmbedJobData,
  ingestionEmbedQueue,
} from './ingestion.queue.js';
import { EmbeddingService } from '../embedding/embedding.service.js';
import { VectorStoreService } from '../vectorstore/vectorstore.service.js';
/**
 * Register all source handlers into IngestionRegistry at boot time
 */
export function registerAllIngestionHandlers(): void {
  IngestionRegistry.register(new PDFIngestionHandler());
  IngestionRegistry.register(new WebsiteIngestionHandler());
  IngestionRegistry.register(new TextIngestionHandler());
  console.log('✅ [IngestionWorkers] All source handlers successfully registered in IngestionRegistry.');
}
/**
 * Worker 1: CPU-Heavy Parse & Chunk Worker
 */
export const ingestionParseWorker = new Worker<IngestionParseJobData>(
  INGESTION_PARSE_QUEUE_NAME,
  async (job: Job<IngestionParseJobData>) => {
    const { sourceId } = job.data;
    console.log(`⚙️  [ParseWorker] Processing source ingestion for sourceId: ${sourceId}...`);
    // 1. Fetch Source
    const source = await prisma.source.findUnique({ where: { id: sourceId } });
    if (!source) {
      throw new Error(`[ParseWorker] Source ${sourceId} not found in database.`);
    }
    try {
      await prisma.source.update({
        where: { id: sourceId },
        data: { status: IngestionStatus.PROCESSING, statusReason: null },
      });
      await prisma.ingestionJob.create({
        data: {
          sourceId,
          stage: 'PARSING',
          status: IngestionStatus.PROCESSING,
        },
      });
      const handler = IngestionRegistry.getHandler(source.type);
      const extractedDoc = await handler.extractContent(source);
      await prisma.ingestionJob.create({
        data: {
          sourceId,
          stage: 'CHUNKING',
          status: IngestionStatus.PROCESSING,
        },
      });

      const processedChunks = await handler.chunkDocument(extractedDoc);
      await prisma.$transaction(
        async (tx) => {
          await tx.chunk.deleteMany({ where: { sourceId } });
          await tx.chunk.createMany({
            data: processedChunks.map((c) => ({
              sourceId: source.id,
              notebookId: source.notebookId,
              userId: source.userId,
              chunkIndex: c.chunkIndex,
              content: c.content,
              tokenCount: c.tokenCount,
              locationMetadata: c.locationMetadata as any,
            })),
          });
        },
        { timeout: 30000 }
      );
      console.log(`✅ [ParseWorker] Successfully extracted & created ${processedChunks.length} chunks for source ${sourceId}`);
      await ingestionEmbedQueue.add(
        'embed-source',
        { sourceId },
        { jobId: `embed-${sourceId}` }
      );
    } catch (err: any) {
      console.error(`❌ [ParseWorker] Ingestion failed for source ${sourceId}:`, err?.message || err);
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          status: IngestionStatus.FAILED,
          statusReason: err?.message || 'Ingestion parsing failed',
        },
      });
      await prisma.ingestionJob.create({
        data: {
          sourceId,
          stage: 'PARSING',
          status: IngestionStatus.FAILED,
          errorDetails: err?.message || 'Parsing failed',
        },
      });
      throw err;
    }
  },
  { connection: redisConnection }
);
/**
 * Worker 2: I/O & API-Bound Vector Embedding & Indexing Worker
 */
export const ingestionEmbedWorker = new Worker<IngestionEmbedJobData>(
  INGESTION_EMBED_QUEUE_NAME,
  async (job: Job<IngestionEmbedJobData>) => {
    const { sourceId } = job.data;
    console.log(`⚡ [EmbedWorker] Generating embeddings & vector points for sourceId: ${sourceId}...`);
    const source = await prisma.source.findUnique({ where: { id: sourceId } });
    if (!source) {
      throw new Error(`[EmbedWorker] Source ${sourceId} not found`);
    }
    const chunks = await prisma.chunk.findMany({
      where: { sourceId },
      orderBy: { chunkIndex: 'asc' },
    });
    if (chunks.length === 0) {
      console.warn(`[EmbedWorker] No chunks found for source ${sourceId}`);
      return;
    }
    try {
      await prisma.ingestionJob.create({
        data: {
          sourceId,
          stage: 'EMBEDDING',
          status: IngestionStatus.PROCESSING,
        },
      });
      const contents = chunks.map((c) => c.content);
      const embeddings = await EmbeddingService.generateEmbeddings(contents);
      const points = chunks.map((chunk, idx) => ({
        chunkId: chunk.id,
        sourceId: chunk.sourceId,
        notebookId: chunk.notebookId,
        userId: chunk.userId,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        vector: embeddings[idx],
        locationMetadata: (chunk.locationMetadata as Record<string, unknown>) || {},
      }));

      await VectorStoreService.upsertChunkPoints(points);
      await prisma.$transaction(
        chunks.map((chunk) =>
          prisma.chunk.update({
            where: { id: chunk.id },
            data: {
              qdrantPointId: VectorStoreService.generatePointId(chunk.sourceId, chunk.chunkIndex),
            },
          })
        ),
        { timeout: 30000 }
      );
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          status: IngestionStatus.COMPLETED,
          statusReason: null,
        },
      });
      await prisma.ingestionJob.create({
        data: {
          sourceId,
          stage: 'STORED',
          status: IngestionStatus.COMPLETED,
        },
      });
      console.log(`🎉 [EmbedWorker] Successfully embedded and indexed source ${sourceId} into Qdrant Cloud.`);
    } catch (err: any) {
      console.error(`❌ [EmbedWorker] Embedding/Indexing failed for source ${sourceId}:`, err?.message || err);
      await prisma.source.update({
        where: { id: sourceId },
        data: {
          status: IngestionStatus.FAILED,
          statusReason: err?.message || 'Embedding generation or vector indexing failed',
        },
      });
      await prisma.ingestionJob.create({
        data: {
          sourceId,
          stage: 'EMBEDDING',
          status: IngestionStatus.FAILED,
          errorDetails: err?.message || 'Embedding failed',
        },
      });
      throw err;
    }
  },
  { connection: redisConnection }
);
