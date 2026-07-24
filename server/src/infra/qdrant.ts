import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../config/env.js';

// Singleton Qdrant Cloud client for vector storage and retrieval
export const qdrantClient = new QdrantClient({
  url: env.QDRANT_URL,
  apiKey: env.QDRANT_API_KEY,
});
