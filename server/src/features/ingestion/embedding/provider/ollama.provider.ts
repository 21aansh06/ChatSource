import { env } from "../../../../config/env.js";
import { EmbeddingProvider } from "./embedding.provider.js";

const MAX_BATCH_SIZE = 64;

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  readonly name = "ollama";
  readonly dimension = 768;

  private readonly model = "nomic-embed-text";

  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const embeddings: number[][] = [];
    console.log(`${env.OLLAMA_BASE_URL}/api/embed`);

    for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
      const batch = texts.slice(i, i + MAX_BATCH_SIZE);

      const response = await fetch(`${env.OLLAMA_BASE_URL}/api/embed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          input: batch,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText}`);
      }

      
    const data = (await response.json()) as {
      embeddings: number[][];
    };

      embeddings.push(...data.embeddings);
    }

    return embeddings;
  }
}