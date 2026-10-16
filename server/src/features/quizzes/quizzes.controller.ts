import { Request, Response, NextFunction } from 'express';
import { QuizzesService } from './services/quizzes.service.js';
import { createQuizInputSchema, submitQuizAttemptSchema } from './schemas/quiz.schema.js';

export class QuizzesController {
  /**
   * POST /api/notebooks/:notebookId/sources/:sourceId/quizzes
   */
  static async generate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { notebookId, sourceId } = req.params;
      console.log(notebookId)
      const parsedInput = createQuizInputSchema.parse(req.body);

      const quiz = await QuizzesService.generateQuizAsync(
        userId,
        notebookId,
        sourceId,
        parsedInput
      );

      res.status(202).json({
        message: 'Quiz generation has been enqueued successfully.',
        quiz,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notebooks/:notebookId/sources/:sourceId/quizzes
   */
  static async listBySource(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { notebookId, sourceId } = req.params;

      const quizzes = await QuizzesService.getQuizzesBySource(userId, notebookId, sourceId);
      res.json(quizzes);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notebooks/:notebookId/quizzes/:quizId
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { notebookId, quizId } = req.params;

      const quiz = await QuizzesService.getQuizById(userId, notebookId, quizId);
      res.json(quiz);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/notebooks/:notebookId/quizzes/:quizId
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { notebookId, quizId } = req.params;

      await QuizzesService.deleteQuiz(userId, notebookId, quizId);
      res.json({ success: true, message: 'Quiz deleted successfully.' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/notebooks/:notebookId/quizzes/:quizId/attempts
   */
  static async submitAttempt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { notebookId, quizId } = req.params;
      const parsed = submitQuizAttemptSchema.parse(req.body);

      const result = await QuizzesService.submitQuizAttempt(
        userId,
        notebookId,
        quizId,
        parsed.answers,
        parsed.timeSpentSec
      );

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notebooks/:notebookId/quizzes/:quizId/attempts
   */
  static async getAttempts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.userId!;
      const { notebookId, quizId } = req.params;

      const attempts = await QuizzesService.getQuizAttempts(userId, notebookId, quizId);
      res.json(attempts);
    } catch (error) {
      next(error);
    }
  }
}
