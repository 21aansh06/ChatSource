import { Request, Response, NextFunction } from 'express';
import { ChatService } from './services/chat.service.js';
import { queryChatSchema } from './schemas/chat.schema.js';

export class ChatController {
  /**
   * POST /api/notebooks/:notebookId/chat
   * Ask question in a notebook chat session (searches across all notebook sources)
   */
  static async ask(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { notebookId } = req.params;

      const validation = queryChatSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.format(),
        });
        return;
      }

      const result = await ChatService.askQuestion(
        userId,
        notebookId,
        validation.data.message,
        validation.data.sessionId
      );

      res.status(200).json({
        sessionId: result.session.id,
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        citations: result.ragResult.citations,
        isLowConfidence: result.ragResult.isLowConfidence,
      });
    } catch (err: any) {
      if (err?.message?.includes('not found') || err?.message?.includes('unauthorized')) {
        res.status(404).json({ error: err.message });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/notebooks/:notebookId/chat/sessions
   * List all chat sessions for a notebook
   */
  static async listSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { notebookId } = req.params;

      const sessions = await ChatService.listSessions(userId, notebookId);

      if (sessions === null) {
        res.status(404).json({ error: 'Notebook not found or unauthorized' });
        return;
      }

      res.status(200).json({ sessions });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notebooks/:notebookId/chat/sessions/:sessionId
   * Get message history for a specific chat session
   */
  static async getSessionHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { notebookId, sessionId } = req.params;

      const session = await ChatService.getSessionHistory(userId, notebookId, sessionId);

      if (!session) {
        res.status(404).json({ error: 'Chat session not found or unauthorized' });
        return;
      }

      res.status(200).json({ session });
    } catch (err) {
      next(err);
    }
  }
}
