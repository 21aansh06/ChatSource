import { Request, Response } from 'express';
import { UsersService } from './users.service.js';

export class UsersController {
  static async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized', message: 'User ID missing in request context.' });
        return;
      }

      const user = await UsersService.getOrCreateUser(userId);
      if (!user) {
        res.status(404).json({ error: 'Not Found', message: 'User profile not found.' });
        return;
      }

      res.status(200).json({ data: user });
    } catch (err: any) {
      console.error('[UsersController] getCurrentUser error:', err);
      res.status(500).json({ error: 'Internal Server Error', message: err?.message || 'Failed to fetch user profile.' });
    }
  }
}
