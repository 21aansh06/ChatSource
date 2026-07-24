import { EmbeddingProvider } from './provider/embedding.provider.js';
import { OpenAIEmbeddingProvider } from './provider/openai.provider.js';


export class EmbeddingService {
  private static provider: EmbeddingProvider = new OpenAIEmbeddingProvider();

  static setProvider(p: EmbeddingProvider): void {
    this.provider = p;
    console.log(`[EmbeddingService] Provider switched to "${p.name}" (dimension=${p.dimension})`);
  }

  static get dimension(): number {
    return this.provider.dimension;
  }

  static async generateEmbedding(text: string): Promise<number[]> {
    const [embedding] = await this.provider.generateBatchEmbeddings([text]);
    return embedding;
  }

  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return this.provider.generateBatchEmbeddings(texts);
  }
}
