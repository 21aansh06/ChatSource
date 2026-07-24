import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { clerkMiddleware } from './infra/clerk.js';
import { errorHandler } from './middleware/error.js';
import { notebookRoutes } from './features/notebooks/notebooks.routes.js';
import { sourceRoutes, directSourceRoutes } from './features/sources/sources.routes.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(clerkMiddleware());

app.use('/api/notebooks', notebookRoutes);
app.use('/api/notebooks/:notebookId/sources', sourceRoutes);
app.use('/api/sources', directSourceRoutes);

// Root endpoint sanity check
app.get('/', (_req, res) => {
  res.json({
    name: 'ChatSource RAG Server API',
    status: 'running',
    healthCheck: '/health',
  });
});

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`🚀 [API Process] HTTP Server listening on port ${env.PORT}`);
});

export default app;
