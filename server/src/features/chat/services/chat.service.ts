import { prisma } from '../../../infra/prisma.js';
import { ChatRole } from '@prisma/client';
import { chatAnswerQueue } from '../queue/chat.queue.js';

export class ChatService {
  /**
   * Async HTTP 202 Accepted Workflow:
   * 1. Validates Notebook ownership for multi-tenant isolation.
   * 2. Resolves or creates ChatSession.
   * 3. Persists User ChatMessage record.
   * 4. Enqueues job to BullMQ chatAnswerQueue (Non-blocking async principle).
   * 5. Returns HTTP 202 Accepted payload with streaming URL.
   */
  static async enqueueQuestion(
    userId: string,
    notebookId: string,
    message: string,
    sessionId?: string
  ): Promise<{ session: any; userMessage: any; streamUrl: string }> {
    // 1. Verify Notebook ownership for multi-tenant isolation
    const notebook = await prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });

    if (!notebook) {
      throw new Error('Notebook not found or unauthorized access');
    }

    // 2. Get or Create ChatSession
    let session: any;
    if (sessionId) {
      session = await prisma.chatSession.findFirst({
        where: { id: sessionId, notebookId, userId },
      });
      if (!session) {
        throw new Error('Chat session not found');
      }
    } else {
      session = await prisma.chatSession.create({
        data: {
          notebookId,
          userId,
          title: message.slice(0, 40) + '...',
        },
      });
    }

    // 3. Save User Message
    const userMsgRecord = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: ChatRole.USER,
        content: message,
      },
    });

    // 4. Enqueue BullMQ background job (Returns immediately without blocking HTTP response)
    await chatAnswerQueue.add(
      'generate-answer',
      {
        sessionId: session.id,
        notebookId,
        userId,
        userMessageId: userMsgRecord.id,
        userMessage: message,
      },
      { jobId: `chat-${userMsgRecord.id}` } // Idempotent job ID
    );

    const streamUrl = `/api/notebooks/${notebookId}/chat/stream/${session.id}`;

    return {
      session,
      userMessage: userMsgRecord,
      streamUrl,
    };
  }

  /**
   * List all chat sessions for a notebook
   */
  static async listSessions(userId: string, notebookId: string) {
    const notebook = await prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });

    if (!notebook) {
      return null;
    }

    return prisma.chatSession.findMany({
      where: { notebookId, userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  /**
   * Get single chat session message history with citations
   */
  static async getSessionHistory(userId: string, notebookId: string, sessionId: string) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, notebookId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return session;
  }
}
