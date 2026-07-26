import { LLMProvider } from '../llm/llm.provider.js';
import { RetrievalService } from './retrieval.service.js';
import { ScoredChunk } from '../reranker/reranker.interface.js';
import {
  queryExpansionSchema,
  judgeResponseSchema,
  JudgeResponse,
  QueryExpansionResult,
} from '../schemas/chat.schema.js';
import { GeminiLLMProvider } from '../llm/gemini.provider.js';

export interface CitationItem {
  citationId: number;
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: string;
  locationMetadata: Record<string, unknown>;
  snippet: string;
}

export interface RAGAnswerResult {
  answer: string;
  citations: CitationItem[];
  isLowConfidence: boolean;
  faithfulnessScore?: number;
  relevanceScore?: number;
  retryAttempts: number;
}

export class RAGService {
  private static llm: LLMProvider = new GeminiLLMProvider();

  static setLLMProvider(provider: LLMProvider): void {
    this.llm = provider;
  }

  private static async expandQuery(userQuery: string): Promise<string[]> {
    const systemPrompt = `You are a query expansion assistant for a multi-source RAG search engine.
Given the user's input query, generate a JSON object with:
1. "stepBackQuery": A broader, higher-level abstract version of the query.
2. "typoCorrectedQuery": A spelling/grammar corrected version of the query.
3. "hydePassage": A 2-sentence hypothetical answer paragraph directly answering the query.
4. "subQuestions": An array of at most 2 decomposed sub-questions.

Respond ONLY with valid JSON.`;

    try {
      const rawJson = await this.llm.generateStructuredJSON<QueryExpansionResult>(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userQuery },
        ],
        { temperature: 0.1 }
      );

      const parsed = queryExpansionSchema.safeParse(rawJson);
      if (parsed.success) {
        const d = parsed.data;
        const variants = [
          userQuery,
          d.typoCorrectedQuery || userQuery,
          d.stepBackQuery || userQuery,
          d.hydePassage || userQuery,
          ...(d.subQuestions || []),
        ];
        return Array.from(new Set(variants.filter((q) => q && q.trim().length > 0))).slice(0, 6);
      }
    } catch (err) {
      console.warn(`[RAGService] Query expansion failed, falling back to original query:`, err);
    }

    return [userQuery];
  }

  private static async judgeAnswer(
    userQuery: string,
    retrievedContext: string,
    generatedAnswer: string
  ): Promise<JudgeResponse> {
    const judgePrompt = `You are a strict RAG Quality Judge evaluating an AI answer against retrieved source passages.
Evaluate the generated answer on two separate 0.0 to 1.0 numeric scores:

1. "faithfulnessScore": Is the answer strictly supported by the retrieved passages without outside hallucination? (1.0 = fully supported, 0.0 = completely fabricated).
2. "relevanceScore": Does the answer directly address the user's question? (1.0 = directly answers question, 0.0 = irrelevant or off-topic).
3. "reasoning": Brief explanation of the scores.

Respond ONLY in valid JSON with schema: {"faithfulnessScore": number, "relevanceScore": number, "reasoning": string}`;

    const judgeMessages = [
      { role: 'system' as const, content: judgePrompt },
      {
        role: 'user' as const,
        content: `User Question: "${userQuery}"\n\nRetrieved Context:\n${retrievedContext}\n\nGenerated Answer:\n${generatedAnswer}`,
      },
    ];

    let rawJudge = await this.llm.generateStructuredJSON<JudgeResponse>(judgeMessages, { temperature: 0.0 });
    let parseResult = judgeResponseSchema.safeParse(rawJudge);

    if (!parseResult.success) {
      console.warn(`[RAGService] Judge output failed schema validation. Re-prompting for schema repair...`);
      const repairMessages = [
        ...judgeMessages,
        { role: 'assistant' as const, content: JSON.stringify(rawJudge) },
        {
          role: 'user' as const,
          content: `Your previous response failed JSON schema validation (${parseResult.error.message}). Please return valid JSON with numeric faithfulnessScore (0-1) and relevanceScore (0-1).`,
        },
      ];
      rawJudge = await this.llm.generateStructuredJSON<JudgeResponse>(repairMessages, { temperature: 0.0 });
      parseResult = judgeResponseSchema.safeParse(rawJudge);
    }

    if (parseResult.success) {
      return parseResult.data;
    }

    return {
      faithfulnessScore: 0.5,
      relevanceScore: 0.5,
      reasoning: 'Schema validation fallback',
    };
  }

  private static buildDeterministicCitations(chunks: ScoredChunk[]): CitationItem[] {
    return chunks.map((chunk, idx) => ({
      citationId: idx + 1,
      chunkId: chunk.chunkId,
      sourceId: chunk.sourceId,
      sourceTitle: chunk.sourceTitle || 'Untitled Source',
      sourceType: chunk.sourceType || 'DOCUMENT',
      locationMetadata: chunk.locationMetadata,
      snippet: chunk.content.slice(0, 150) + '...',
    }));
  }

  /**
   * RAG Execution Pipeline with optional Real-Time Token Streaming callback
   */
  static async answerQuestion(
    userId: string,
    notebookId: string,
    userQuery: string,
    onToken?: (token: string) => Promise<void> | void
  ): Promise<RAGAnswerResult> {
    const queries = await this.expandQuery(userQuery);

    const { scoredChunks } = await RetrievalService.searchNotebookChunks(
      userId,
      notebookId,
      queries,
      10,
      10
    );

    if (scoredChunks.length === 0 || scoredChunks[0].rerankScore < 0.25) {
      console.log(`[RAGService] Low-confidence triggered: no relevant chunks found in notebook ${notebookId}`);
      const fallbackText = "I couldn't find sufficient information in the notebook's sources to answer your question confidently.";
      if (onToken) {
        await onToken(fallbackText);
      }
      return {
        answer: fallbackText,
        citations: [],
        isLowConfidence: true,
        retryAttempts: 0,
      };
    }

    const MAX_RETRIES = 2;
    let selectedChunks = scoredChunks.slice(0, 6);

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt === 1) {
        selectedChunks = scoredChunks.slice(0, 8);
        console.log(`[RAGService] Corrective Retry Attempt 1: Widening candidate pool to 8 chunks...`);
      } else if (attempt === 2) {
        selectedChunks = scoredChunks.slice(0, 4);
        console.log(`[RAGService] Corrective Retry Attempt 2: Sharpening context to top 4 chunks...`);
      }

      const contextText = selectedChunks
        .map(
          (c, idx) =>
            `[Source ${idx + 1}: ${c.sourceTitle} (${c.sourceType}) | Location: ${JSON.stringify(c.locationMetadata)}]\n${c.content}`
        )
        .join('\n\n---\n\n');

      const answerSystemPrompt = `You are NotebookLM ChatSource assistant. Answer the user's question strictly using ONLY the provided notebook source passages below.
Insert numerical citation markers like [1], [2] whenever referencing specific facts from the sources.
If the source passages do not contain enough information to answer, state clearly that the answer is unavailable in the sources.`;

      const promptMessages = [
        { role: 'system' as const, content: answerSystemPrompt },
        { role: 'user' as const, content: `Source Passages:\n${contextText}\n\nUser Question: ${userQuery}` },
      ];

      // Stream completion if callback provided, otherwise standard completion
      let generatedAnswer = '';
      if (onToken) {
        generatedAnswer = await this.llm.streamCompletion(promptMessages, onToken, { temperature: 0.2 });
      } else {
        generatedAnswer = await this.llm.generateCompletion(promptMessages, { temperature: 0.2 });
      }

      const judgeResult = await this.judgeAnswer(userQuery, contextText, generatedAnswer);

      console.log(
        `[RAGService] Attempt ${attempt} Judge Scores: Faithfulness=${judgeResult.faithfulnessScore}, Relevance=${judgeResult.relevanceScore}`
      );

      if (judgeResult.faithfulnessScore >= 0.7 && judgeResult.relevanceScore >= 0.7) {
        const citations = this.buildDeterministicCitations(selectedChunks);
        return {
          answer: generatedAnswer,
          citations,
          isLowConfidence: false,
          faithfulnessScore: judgeResult.faithfulnessScore,
          relevanceScore: judgeResult.relevanceScore,
          retryAttempts: attempt,
        };
      }
    }

    console.warn(`[RAGService] Retry budget exhausted without passing quality threshold. Falling into low-confidence path.`);
    const fallbackText = "I couldn't find sufficient information in the notebook's sources to answer your question confidently.";
    return {
      answer: fallbackText,
      citations: [],
      isLowConfidence: true,
      retryAttempts: MAX_RETRIES,
    };
  }
}
