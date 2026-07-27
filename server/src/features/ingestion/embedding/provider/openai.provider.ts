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

  async generateBatchEmbeddings(
    texts: string[]
  ): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const embeddings: number[][] = [];

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

      response.data
        .sort((a, b) => a.index - b.index)
        .forEach((item) => {
          embeddings.push(item.embedding);
        });
    }

    return embeddings;
  }
}