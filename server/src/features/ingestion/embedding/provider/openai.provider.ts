import OpenAI from "openai";

import { env } from "../../../../config/env.js";
import { EmbeddingProvider } from "./embedding.provider.js";

const MAX_BATCH_SIZE = 512;

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  readonly dimension = 1536;

  private readonly client: OpenAI;
  private readonly model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
    this.model = env.OPENAI_EMBEDDING_MODEL;
  }

  async generateBatchEmbeddingsWithUsage(
    texts: string[]
  ): Promise<{ embeddings: number[][]; totalTokens: number }> {
    if (texts.length === 0) {
      return { embeddings: [], totalTokens: 0 };
    }

    const embeddings: number[][] = [];
    let totalTokens = 0;

    for (
      let i = 0;
      i < texts.length;
      i += MAX_BATCH_SIZE
    ) {
      const batch = texts.slice(
        i,
        i + MAX_BATCH_SIZE
      );

      const response =
        await this.client.embeddings.create({
          model: this.model,
          input: batch,
        });

      totalTokens += response.usage?.total_tokens ?? 0;

      response.data
        .sort((a, b) => a.index - b.index)
        .forEach((item) => {
          embeddings.push(item.embedding);
        });
    }

    return { embeddings, totalTokens };
  }

  async generateBatchEmbeddings(
    texts: string[]
  ): Promise<number[][]> {
    const res = await this.generateBatchEmbeddingsWithUsage(texts);
    return res.embeddings;
  }
}