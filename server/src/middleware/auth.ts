import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireUserAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);

  if (!auth || !auth.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required to access this resource.',
    });
    return;
  }

  req.userId = auth.userId;
  next();
};
