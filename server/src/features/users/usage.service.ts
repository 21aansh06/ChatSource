import { prisma } from '../../infra/prisma.js';

export class UsageService {
  /**
   * Retrieves or initializes the Usage record for a user.
   */
  static async getUserUsage(userId: string) {
    if (!userId) return null;

    let usage = await prisma.usage.findUnique({
      where: { userId },
    });

    if (!usage) {
      usage = await prisma.usage.create({
        data: {
          userId,
          sourcesAddedCount: 0,
          successfulQueriesCount: 0,
          embeddingInputTokens: 0,
          chatInputTokens: 0,
          chatOutputTokens: 0,
        },
      });
    }

    return usage;
  }

  /**
   * Increments sourcesAddedCount ONLY when a source is ingested successfully.
   */
  static async incrementSuccessfulSource(userId: string) {
    if (!userId) return;

    await prisma.usage.upsert({
      where: { userId },
      update: {
        sourcesAddedCount: { increment: 1 },
      },
      create: {
        userId,
        sourcesAddedCount: 1,
        successfulQueriesCount: 0,
        embeddingInputTokens: 0,
        chatInputTokens: 0,
        chatOutputTokens: 0,
      },
    });
  }

  static async addEmbeddingTokens(userId: string, tokens: number) {
    if (!userId || tokens <= 0) return;

    await prisma.usage.upsert({
      where: { userId },
      update: {
        embeddingInputTokens: { increment: tokens },
      },
      create: {
        userId,
        sourcesAddedCount: 0,
        successfulQueriesCount: 0,
        embeddingInputTokens: tokens,
        chatInputTokens: 0,
        chatOutputTokens: 0,
      },
    });
  }

  static async recordQuerySuccess(
    userId: string,
    promptTokens: number,
    completionTokens: number
  ) {
    if (!userId) return;

    await prisma.usage.upsert({
      where: { userId },
      update: {
        successfulQueriesCount: { increment: 1 },
        chatInputTokens: { increment: Math.max(0, promptTokens) },
        chatOutputTokens: { increment: Math.max(0, completionTokens) },
      },
      create: {
        userId,
        sourcesAddedCount: 0,
        successfulQueriesCount: 1,
        embeddingInputTokens: 0,
        chatInputTokens: Math.max(0, promptTokens),
        chatOutputTokens: Math.max(0, completionTokens),
      },
    });
  }

  static async addChatTokens(
    userId: string,
    promptTokens: number,
    completionTokens: number
  ) {
    if (!userId || (promptTokens <= 0 && completionTokens <= 0)) return;

    await prisma.usage.upsert({
      where: { userId },
      update: {
        chatInputTokens: { increment: Math.max(0, promptTokens) },
        chatOutputTokens: { increment: Math.max(0, completionTokens) },
      },
      create: {
        userId,
        sourcesAddedCount: 0,
        successfulQueriesCount: 0,
        embeddingInputTokens: 0,
        chatInputTokens: Math.max(0, promptTokens),
        chatOutputTokens: Math.max(0, completionTokens),
      },
    });
  }
}
