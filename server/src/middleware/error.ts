import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

/**
 * Global Express error handling middleware.
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode === 429 || statusCode === 403 || err.name === 'PlanLimitError') {
    console.warn(`[QuotaLimit] ${statusCode} - ${message}`);
  } else {
    console.error(`[Error] ${statusCode} - ${message}`, err.stack);
  }

  res.status(statusCode).json({
    error: message,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
};
