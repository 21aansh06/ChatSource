import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { clerkMiddleware } from './infra/clerk.js';
import { errorHandler } from './middleware/error.js';
import { notebookRoutes } from './features/notebooks/notebooks.routes.js';
import { sourceRoutes, directSourceRoutes } from './features/sources/sources.routes.js';
import { chatRoutes } from './features/chat/chat.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(clerkMiddleware());

  app.use('/api/notebooks', notebookRoutes);
  app.use('/api/notebooks/:notebookId/sources', sourceRoutes);
  app.use('/api/notebooks/:notebookId/chat', chatRoutes);
  app.use('/api/sources', directSourceRoutes);

  app.get('/', (_req, res) => {
    res.json({
      name: 'ChatSource RAG Server API',
      status: 'running',
    });
  });

  app.use(errorHandler);

  return app;
}