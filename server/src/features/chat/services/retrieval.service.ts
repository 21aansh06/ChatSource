import { qdrantClient } from '../../../infra/qdrant.js';
import { prisma } from '../../../infra/prisma.js';
import { EmbeddingService } from '../../ingestion/embedding/embedding.service.js';
import { Reranker, CandidateChunk, ScoredChunk } from '../reranker/reranker.interface.js';
import { DefaultReranker } from '../reranker/default.reranker.js';

const COLLECTION_NAME = 'notebook_chunks';

export class RetrievalService {
  private static reranker: Reranker = new DefaultReranker();

  static setReranker(r: Reranker): void {
    this.reranker = r;
  }

  /**
   * Multi-Query Fan-Out & Concurrent Qdrant Vector Search across ALL sources in the notebook.
   * Multi-Tenant Isolation: Hard-scoped to { notebookId, userId } at vector database query level.
   */
  static async searchNotebookChunks(
    userId: string,
    notebookId: string,
    queries: string[],
    topKPerQuery = 10,
    rerankTopN = 6
  ): Promise<{ scoredChunks: ScoredChunk[]; rawCandidateCount: number }> {
    const queryEmbeddings = await EmbeddingService.generateEmbeddings(queries);

    const searchPromises = queryEmbeddings.map((vector) =>
      qdrantClient.search(COLLECTION_NAME, {
        vector,
        limit: topKPerQuery,
        filter: {
          must: [
            { key: 'notebookId', match: { value: notebookId } },
            { key: 'userId', match: { value: userId } },
          ],
        },
      })
    );

    const queryResultsList = await Promise.all(searchPromises);

    const chunkRankMap = new Map<string, { candidate: CandidateChunk; rrfScore: number }>();
    const RRF_K = 60;

    queryResultsList.forEach((results) => {
      results.forEach((hit, rank) => {
        const payload = hit.payload as any;
        const chunkId = payload.chunkId as string;

        const rankScore = 1.0 / (RRF_K + (rank + 1));

        if (!chunkRankMap.has(chunkId)) {
          chunkRankMap.set(chunkId, {
            candidate: {
              chunkId,
              sourceId: payload.sourceId,
              notebookId: payload.notebookId,
              userId: payload.userId,
              chunkIndex: payload.chunkIndex,
              content: payload.content,
              rrfScore: rankScore,
              locationMetadata: payload.locationMetadata || {},
            },
            rrfScore: rankScore,
          });
        } else {
          const entry = chunkRankMap.get(chunkId)!;
          entry.rrfScore += rankScore;
          entry.candidate.rrfScore = entry.rrfScore;
        }
      });
    });

    const candidates = Array.from(chunkRankMap.values()).map((e) => e.candidate);

    if (candidates.length === 0) {
      return { scoredChunks: [], rawCandidateCount: 0 };
    }

    const sourceIds = Array.from(new Set(candidates.map((c) => c.sourceId)));
    const sources = await prisma.source.findMany({
      where: { id: { in: sourceIds } },
      select: { id: true, title: true, type: true },
    });
    const sourceMap = new Map(sources.map((s) => [s.id, s]));

    candidates.forEach((c) => {
      const src = sourceMap.get(c.sourceId);
      if (src) {
        c.sourceTitle = src.title;
        c.sourceType = src.type;
      }
    });

    const originalQuery = queries[0];
    const scoredChunks = await this.reranker.rerank(originalQuery, candidates, rerankTopN);

    return {
      scoredChunks,
      rawCandidateCount: candidates.length,
    };
  }
}
