import { Request, Response, NextFunction } from 'express';
import { getAuth } from '@clerk/express';
import { env } from '../config/env';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireUserAuth = (req: Request, res: Response, next: NextFunction) => {
  if (env.NODE_ENV === "development") {
    const userId = req.header("x-user-id");

    if (userId) {
      req.userId = userId;
      return next();
    }
  }

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
