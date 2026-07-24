// import OpenAI from 'openai';
// import { env } from '../../../../config/env.js';
// import { EmbeddingProvider } from './embedding.provider.js';


// const MAX_BATCH_SIZE = 512;

// export class OpenAIEmbeddingProvider implements EmbeddingProvider {
//   readonly name = 'openai';
//   readonly dimension: number;

//   private client: OpenAI;
//   private model: string;

//   constructor() {
//     this.client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
//     this.model = env.OPENAI_EMBEDDING_MODEL;
//     const dimensionMap: Record<string, number> = {
//       'text-embedding-3-small': 1536,
//       'text-embedding-3-large': 3072,
//       'text-embedding-ada-002': 1536,
//     };
//     this.dimension = dimensionMap[this.model] ?? 1536;
//   }

//   async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
//     if (texts.length === 0) return [];

//     const allEmbeddings: number[][] = [];

//     // Process in batches to respect API limits
//     for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
//       const batch = texts.slice(i, i + MAX_BATCH_SIZE);

//       const response = await this.client.embeddings.create({
//         model: this.model,
//         input: batch,
//       });

//       const sorted = response.data.sort((a, b) => a.index - b.index);
//       allEmbeddings.push(...sorted.map((d) => d.embedding));
//     }

//     return allEmbeddings;
//   }
// }
