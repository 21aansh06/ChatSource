import { Request, Response, NextFunction } from 'express';
import { NotebooksService } from './notebooks.service.js';
import { createNotebookSchema, updateNotebookSchema, notebookParamSchema } from './notebooks.schema.js';

export class NotebooksController {
  /**
   * POST /api/notebooks
   * Create a new notebook
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const validation = createNotebookSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.format(),
        });
        return;
      }

      const notebook = await NotebooksService.createNotebook(userId, validation.data);
      res.status(201).json({
        message: 'Notebook created successfully',
        notebook,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notebooks
   * List all notebooks for authenticated user
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const notebooks = await NotebooksService.listNotebooks(userId);
      res.status(200).json({
        notebooks,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notebooks/:id
   * Get single notebook by ID
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const paramValidation = notebookParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        res.status(400).json({
          error: 'Invalid notebook ID format',
        });
        return;
      }

      const notebook = await NotebooksService.getNotebookById(userId, paramValidation.data.id);

      if (!notebook) {
        res.status(404).json({
          error: 'Notebook not found',
        });
        return;
      }

      res.status(200).json({
        notebook,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notebooks/:id
   * Update notebook title or description
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const paramValidation = notebookParamSchema.safeParse(req.params);
      const bodyValidation = updateNotebookSchema.safeParse(req.body);

      if (!paramValidation.success) {
        res.status(400).json({ error: 'Invalid notebook ID format' });
        return;
      }

      if (!bodyValidation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: bodyValidation.error.format(),
        });
        return;
      }

      const updatedNotebook = await NotebooksService.updateNotebook(
        userId,
        paramValidation.data.id,
        bodyValidation.data
      );

      if (!updatedNotebook) {
        res.status(404).json({ error: 'Notebook not found or unauthorized' });
        return;
      }

      res.status(200).json({
        message: 'Notebook updated successfully',
        notebook: updatedNotebook,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/notebooks/:id
   * Delete notebook by ID
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const paramValidation = notebookParamSchema.safeParse(req.params);

      if (!paramValidation.success) {
        res.status(400).json({ error: 'Invalid notebook ID format' });
        return;
      }

      const deleted = await NotebooksService.deleteNotebook(userId, paramValidation.data.id);

      if (!deleted) {
        res.status(404).json({ error: 'Notebook not found or unauthorized' });
        return;
      }

      res.status(200).json({
        message: 'Notebook deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
