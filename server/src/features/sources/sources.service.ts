import { randomUUID } from 'crypto';
import { prisma } from '../../infra/prisma.js';
import { CreateSourceInput } from './sources.schema.js';
import { IngestionStatus, SourceType, UserPlan } from '@prisma/client';
import { enqueueSourceIngestion } from '../ingestion/queue/ingestion.queue.js';
import { VectorStoreService } from '../ingestion/vectorstore/vectorstore.service.js';
import { StorageService } from '../storage/storage.service.js';
import { generateStorageKey } from '../storage/storage.utils.js';
import { parseMulterFile } from '../storage/storage.schema.js';
import { UsersService } from '../users/users.service.js';
import { UsageService } from '../users/usage.service.js';
import { PlanLimitError } from '../../utils/errors.js';

export class SourcesService {
  static async createSource(
    userId: string,
    notebookId: string,
    input: CreateSourceInput,
    file?: Express.Multer.File
  ) {
    const notebook = await prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });

    if (!notebook) {
      return null;
    }

    // Check Free Plan source upload limit (Max 2 sources total)
    const user = await UsersService.getOrCreateUser(userId);
    const usage = await UsageService.getUserUsage(userId);
    if (user?.plan === UserPlan.FREE && (usage?.sourcesAddedCount ?? 0) >= 2) {
      throw new PlanLimitError('Free plan limit reached (2/2 sources added). Please upgrade to a Paid plan for unlimited sources.');
    }

    let fileKey: string | undefined = input.fileKey;
    let mimeType: string | undefined;
    let fileSize: number | undefined;

    if (file) {
      const uploadPayload = parseMulterFile(file);
      const fileId = randomUUID();
      const storageKey = generateStorageKey(userId, fileId, 'pdf');

      fileKey = await StorageService.upload(storageKey, uploadPayload);
      mimeType = uploadPayload.mimeType;
      fileSize = uploadPayload.size;
    } else if (input.type === SourceType.PDF && !fileKey) {
      throw new Error('PDF file upload is required for PDF source type.');
    } else if (input.type === SourceType.YOUTUBE && !input.url) {
      throw new Error('YouTube URL is required for YOUTUBE source type.');
    }

    // 2. Create Source record with async PENDING status
    const source = await prisma.source.create({
      data: {
        notebookId,
        userId,
        title: input.title,
        type: input.type,
        status: IngestionStatus.PENDING,
        fileKey,
        mimeType,
        fileSize,
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
      where: {
        notebookId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        statusReason: true,
        createdAt: true,
        updatedAt: true,
        fileSize: true,
        mimeType: true,
        url: true,

        ingestionJobs: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            stage: true,
            status: true,
            errorDetails: true,
            createdAt: true,
            updatedAt: true,
          },
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
