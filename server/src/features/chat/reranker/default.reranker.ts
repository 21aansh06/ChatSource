import { Reranker, CandidateChunk, ScoredChunk } from './reranker.interface.js';

export class DefaultReranker implements Reranker {
  readonly name = 'default-cross-score-reranker';

  async rerank(query: string, candidates: CandidateChunk[], topN: number): Promise<ScoredChunk[]> {
    if (candidates.length === 0) return [];

    const queryTokens = new Set(
      query
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter((t) => t.length > 2)
    );

    const scored: ScoredChunk[] = candidates.map((cand) => {
      const contentLower = cand.content.toLowerCase();
      let matchCount = 0;

      queryTokens.forEach((token) => {
        if (contentLower.includes(token)) {
          matchCount += 1;
        }
      });

      const termOverlapScore = queryTokens.size > 0 ? matchCount / queryTokens.size : 0.5;
      
      // Combine RRF rank score with keyword cross-encoder term overlap
      const rerankScore = cand.rrfScore * 0.5 + termOverlapScore * 0.5;

      return {
        ...cand,
        rerankScore,
      };
    });

    // Sort descending by rerankScore
    scored.sort((a, b) => b.rerankScore - a.rerankScore);

    return scored.slice(0, topN);
  }
}
