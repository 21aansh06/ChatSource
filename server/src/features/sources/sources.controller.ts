import { Request, Response, NextFunction } from 'express';
import { SourcesService } from './sources.service.js';
import { createSourceSchema } from './sources.schema.js';

export class SourcesController {
  /**
   * POST /api/notebooks/:notebookId/sources
   * Create a new source record in PENDING ingestion status
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { notebookId } = req.params;

      const validation = createSourceSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          error: 'Validation Error',
          details: validation.error.format(),
        });
        return;
      }

      const source = await SourcesService.createSource(
        userId,
        notebookId,
        validation.data,
        req.file
      );

      if (!source) {
        res.status(444).json({ error: 'Notebook not found or unauthorized' });
        return;
      }

      res.status(201).json({
        message: 'Source record created successfully and queued for ingestion',
        source,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notebooks/:notebookId/sources
   * List sources for a notebook
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { notebookId } = req.params;

      const sources = await SourcesService.listSourcesByNotebook(userId, notebookId);

      if (sources === null) {
        res.status(404).json({ error: 'Notebook not found or unauthorized' });
        return;
      }

      res.status(200).json({ sources });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/sources/:sourceId
   * Delete a source and associated chunks
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.userId!;
      const { sourceId } = req.params;

      const deleted = await SourcesService.deleteSource(userId, sourceId);

      if (!deleted) {
        res.status(404).json({ error: 'Source not found or unauthorized' });
        return;
      }

      res.status(200).json({ message: 'Source deleted successfully' });
    } catch (err) {
      next(err);
    }
  }
}
