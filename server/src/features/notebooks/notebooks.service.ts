import { prisma } from '../../infra/prisma.js';
import { CreateNotebookInput, UpdateNotebookInput } from './notebooks.schema.js';

export class NotebooksService {
  /**
   * Create a new notebook for the authenticated user
   */
  static async createNotebook(userId: string, input: CreateNotebookInput) {
    return prisma.notebook.create({
      data: {
        userId,
        title: input.title,
        description: input.description,
      },
    });
  }

  /**
   * List all notebooks owned by the authenticated user with aggregated counts
   */
  static async listNotebooks(userId: string) {
    return prisma.notebook.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            sources: true,
            chatSessions: true,
          },
        },
      },
    });
  }

  /**
   * Get a single notebook by ID owned by the authenticated user (with nested sources)
   */
  static async getNotebookById(userId: string, notebookId: string) {
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        userId, 
      },
      include: {
        sources: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            type: true,
            status: true,
            statusReason: true,
            fileKey: true,
            url: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        chatSessions: {
          orderBy: { updatedAt: 'desc' },
          select: {
            id: true,
            title: true,
            updatedAt: true,
          },
        },
        _count: {
          select: {
            chunks: true,
          },
        },
      },
    });

    if (!notebook) {
      return null;
    }

    return notebook;
  }

  /**
   * Update notebook title or description owned by authenticated user
   */
  static async updateNotebook(userId: string, notebookId: string, input: UpdateNotebookInput) {
    // Scoped update via updateMany to guarantee user ownership
    const result = await prisma.notebook.updateMany({
      where: {
        id: notebookId,
        userId, 
      },
      data: {
        ...(input.title ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return this.getNotebookById(userId, notebookId);
  }

  /**
   * Delete notebook owned by authenticated user (cascades to sources, chunks, chats)
   */
  static async deleteNotebook(userId: string, notebookId: string) {
    const result = await prisma.notebook.deleteMany({
      where: {
        id: notebookId,
        userId, 
      },
    });

    return result.count > 0;
  }
}
