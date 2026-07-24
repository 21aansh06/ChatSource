import { prisma } from '../../infra/prisma.js';
import { CreateSourceInput } from './sources.schema.js';
import { IngestionStatus } from '@prisma/client';
import { enqueueSourceIngestion } from '../ingestion/queue/ingestion.queue.js';
import { VectorStoreService } from '../ingestion/vectorstore/vectorstore.service.js';

export class SourcesService {
  static async createSource(userId: string, notebookId: string, input: CreateSourceInput) {
    const notebook = await prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });

    if (!notebook) {
      return null;
    }

    // 2. Create Source record with async PENDING status
    const source = await prisma.source.create({
      data: {
        notebookId,
        userId,
        title: input.title,
        type: input.type,
        status: IngestionStatus.PENDING,
        fileKey: input.fileKey,
        url: input.url,
        rawText: input.rawText,
      },
    });

    // 3. Create initial IngestionJob record tracking stage
    await prisma.ingestionJob.create({
      data: {
        sourceId: source.id,
        stage: 'QUEUED',
        status: IngestionStatus.PENDING,
      },
    });

    // 4. Enqueue to BullMQ async ingestion queue (Non-blocking async principle)
    await enqueueSourceIngestion(source.id);

    return source;
  }

  static async listSourcesByNotebook(userId: string, notebookId: string) {
    const notebook = await prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });

    if (!notebook) {
      return null;
    }

    return prisma.source.findMany({
      where: { notebookId, userId },
      orderBy: { createdAt: 'desc' },
      include: {
        ingestionJobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  static async deleteSource(userId: string, sourceId: string) {
    const source = await prisma.source.findFirst({
      where: { id: sourceId, userId },
    });

    if (!source) {
      return false;
    }

    await VectorStoreService.deletePointsBySource(sourceId);
    await prisma.source.delete({
      where: { id: sourceId },
    });

    return true;
  }
}
