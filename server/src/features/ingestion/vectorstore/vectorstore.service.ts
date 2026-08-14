import { v5 as uuidv5 } from 'uuid';
import { qdrantClient } from '../../../infra/qdrant.js';
import { EmbeddingService } from '../embedding/embedding.service.js';

const COLLECTION_NAME = 'notebook_chunks';
const NAMESPACE_UUID = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

export interface VectorChunkPoint {
  chunkId: string;
  sourceId: string;
  notebookId: string;
  userId: string;
  chunkIndex: number;
  content: string;
  vector: number[];
  locationMetadata: Record<string, unknown>;
}

export class VectorStoreService {
  /**
   * Ensure Qdrant collection exists with multi-tenant payload index fields
   */
  static async ensureCollection(): Promise<void> {
    try {
      const collections = await qdrantClient.getCollections();
      const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

      if (!exists) {
        console.log(`[VectorStoreService] Creating Qdrant collection "${COLLECTION_NAME}"...`);
        await qdrantClient.createCollection(COLLECTION_NAME, {
          vectors: {
            size: EmbeddingService.dimension,
            distance: 'Cosine',
          },
        });
      }

      // Ensure payload indexes exist for fast multi-tenant & source-level filtering
      const fieldsToIndex = ['notebookId', 'userId', 'sourceId'];
      for (const field_name of fieldsToIndex) {
        try {
          await qdrantClient.createPayloadIndex(COLLECTION_NAME, {
            field_name,
            field_schema: 'keyword',
          });
        } catch {
          // index already exists in Qdrant
        }
      }
      console.log(`[VectorStoreService] Qdrant collection "${COLLECTION_NAME}" & tenant/source payload indexes verified.`);
    } catch (err: any) {
      console.error(`[VectorStoreService] Error initializing Qdrant collection:`, err?.message || err);
    }
  }

 
  static generatePointId(sourceId: string, chunkIndex: number): string {
    return uuidv5(`${sourceId}:${chunkIndex}`, NAMESPACE_UUID);
  }

  static async upsertChunkPoints(points: VectorChunkPoint[]): Promise<void> {
    if (points.length === 0) return;

    await this.ensureCollection();

    const qdrantPoints = points.map((p) => ({
      id: this.generatePointId(p.sourceId, p.chunkIndex),
      vector: p.vector,
      payload: {
        chunkId: p.chunkId,
        sourceId: p.sourceId,
        notebookId: p.notebookId, 
        userId: p.userId,        
        chunkIndex: p.chunkIndex,
        content: p.content,
        locationMetadata: p.locationMetadata,
      },
    }));

    await qdrantClient.upsert(COLLECTION_NAME, {
      wait: true,
      points: qdrantPoints,
    });
  }

  /**
   * Delete vector points for a given source (used on source deletion or full re-ingestion)
   */
  static async deletePointsBySource(sourceId: string): Promise<void> {
    try {
      await qdrantClient.delete(COLLECTION_NAME, {
        filter: {
          must: [
            {
              key: 'sourceId',
              match: { value: sourceId },
            },
          ],
        },
      });
    } catch (err: any) {
      console.warn(`[VectorStoreService] Warning deleting vector points for source ${sourceId}:`, err?.message);
    }
  }
}
