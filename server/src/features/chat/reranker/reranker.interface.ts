export interface CandidateChunk {
  chunkId: string;
  sourceId: string;
  notebookId: string;
  userId: string;
  chunkIndex: number;
  content: string;
  rrfScore: number;
  locationMetadata: Record<string, unknown>;
  sourceTitle?: string;
  sourceType?: string;
}

export interface ScoredChunk extends CandidateChunk {
  rerankScore: number;
}


export interface Reranker {
  readonly name: string;

  rerank(query: string, candidates: CandidateChunk[], topN: number): Promise<ScoredChunk[]>;
}
