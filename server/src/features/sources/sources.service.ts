import { prisma } from '../../infra/prisma.js';
import { CreateSourceInput } from './sources.schema.js';
import { IngestionStatus } from '@prisma/client';

export class SourcesService {
  
  static async createSource(userId: string, notebookId: string, input: CreateSourceInput) {
    // 1. Verify Notebook ownership for multi-tenant isolation
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

    return source;
  }

  /**
   * List all sources within a user-owned notebook
   */
  static async listSourcesByNotebook(userId: string, notebookId: string) {
    // Multi-tenant check
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

  /**
   * Delete source record owned by authenticated user
   */
  static async deleteSource(userId: string, sourceId: string) {
    const result = await prisma.source.deleteMany({
      where: { id: sourceId, userId },
    });

    return result.count > 0;
  }
}
