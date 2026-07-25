import { prisma } from '../../../infra/prisma.js';
import { ChatRole } from '@prisma/client';
import { RAGService, RAGAnswerResult } from './rag.service.js';

export class ChatService {
  /**
   * Process a user question inside a notebook chat session with RAG pipeline
   */
  static async askQuestion(
    userId: string,
    notebookId: string,
    message: string,
    sessionId?: string
  ): Promise<{ session: any; userMessage: any; assistantMessage: any; ragResult: RAGAnswerResult }> {
    // 1. Multi-tenant check: Verify notebook ownership
    const notebook = await prisma.notebook.findFirst({
      where: { id: notebookId, userId },
    });

    if (!notebook) {
      throw new Error('Notebook not found or unauthorized access');
    }

    // 2. Get or create ChatSession
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

    // 4. Run RAG Pipeline
    const ragResult = await RAGService.answerQuestion(userId, notebookId, message);

    // 5. Save Assistant Message with deterministic citations payload
    const assistantMsgRecord = await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: ChatRole.ASSISTANT,
        content: ragResult.answer,
        citations: ragResult.citations as any,
      },
    });

    // Update session timestamp
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return {
      session,
      userMessage: userMsgRecord,
      assistantMessage: assistantMsgRecord,
      ragResult,
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
   * Get single chat session message history
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
