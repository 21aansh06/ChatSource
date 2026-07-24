export interface EmbeddingProvider {
  readonly name: string;
  readonly dimension: number;
  generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
}
