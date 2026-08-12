import { LLMProvider } from "../llm/llm.provider.js";
import { RetrievalService } from "./retrieval.service.js";
import { ScoredChunk } from "../reranker/reranker.interface.js";

import {
  queryExpansionSchema,
  judgeResponseSchema,
  QueryExpansionResult,
  JudgeResponse,
} from "../schemas/chat.schema.js";
import { OpenAILLMProvider } from "../llm/openai.provider.js";

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
  private static llm: LLMProvider = new OpenAILLMProvider();

  private static readonly LOW_CONFIDENCE_THRESHOLD = 0.25;

  private static readonly MAX_QUERY_VARIANTS = 6;

  static setLLMProvider(provider: LLMProvider): void {
    this.llm = provider;
  }

  private static async expandQuery(
    userQuery: string
  ): Promise<string[]> {
    const systemPrompt = `
You are a query expansion assistant for a production RAG search engine.

Given the user's question, return ONLY valid JSON.

Return:

{
  "stepBackQuery": string,
  "typoCorrectedQuery": string,
  "hydePassage": string,
  "subQuestions": string[]
}

Rules:

- stepBackQuery should generalize the user's intent.
- typoCorrectedQuery should only fix spelling or grammar.
- hydePassage should be exactly two sentences.
- Generate at most two subQuestions.
- Never include markdown.
- Never explain your reasoning.
`;

    try {
      const result =
        await this.llm.generateStructuredJSON<QueryExpansionResult>(
          [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: userQuery,
            },
          ],
          {
            temperature: 0.1,
          }
        );

      const parsed =
        queryExpansionSchema.safeParse(result);

      if (!parsed.success) {
        console.warn(
          "[RAGService] Query expansion schema validation failed."
        );

        return [userQuery];
      }

      const data = parsed.data;

      const variants = [
        userQuery,
        data.typoCorrectedQuery,
        data.stepBackQuery,
        data.hydePassage,
        ...(data.subQuestions ?? []),
      ];

      return Array.from(
        new Set(
          variants
            .filter(Boolean)
            .map((q) => q.trim())
            .filter((q) => q.length > 0)
        )
      ).slice(0, this.MAX_QUERY_VARIANTS);
    } catch (error) {
      console.warn(
        "[RAGService] Query expansion failed.",
        error
      );

      return [userQuery];
    }
  }


  private static async judgeAnswer(
    userQuery: string,
    retrievedContext: string,
    generatedAnswer: string
  ): Promise<JudgeResponse> {
    const judgePrompt = `
You are a strict RAG evaluation judge.

Evaluate the generated answer ONLY using the retrieved context.

Return ONLY valid JSON.

{
  "faithfulnessScore": number,
  "relevanceScore": number,
  "reasoning": string
}

Scoring:

faithfulnessScore

1.0 = every statement supported

0.0 = hallucinated

relevanceScore

1.0 = fully answers the user's question

0.0 = irrelevant
`;

    const messages = [
      {
        role: "system" as const,
        content: judgePrompt,
      },
      {
        role: "user" as const,
        content: `
User Question

${userQuery}

Retrieved Context

${retrievedContext}

Generated Answer

${generatedAnswer}
`,
      },
    ];

    try {
      const result =
        await this.llm.generateStructuredJSON<JudgeResponse>(
          messages,
          {
            temperature: 0,
          }
        );

      const parsed =
        judgeResponseSchema.safeParse(result);

      if (parsed.success) {
        return parsed.data;
      }

      console.warn(
        "[RAGService] Judge schema validation failed."
      );
    } catch (error) {
      console.warn(
        "[RAGService] Judge failed.",
        error
      );
    }

    return {
      faithfulnessScore: 0.5,
      relevanceScore: 0.5,
      reasoning: "Fallback score",
    };
  }


  /**
   * Dynamically filters and re-indexes citations to include ONLY the chunks
   * actually referenced and cited in the generated answer text.
   */
  private static filterAndBuildUsedCitations(
    answerText: string,
    chunks: ScoredChunk[]
  ): { cleanedAnswer: string; citations: CitationItem[] } {
    if (!answerText || !chunks || chunks.length === 0) {
      return { cleanedAnswer: answerText, citations: [] };
    }

    // 1. Extract all citation numbers [1], [2], [1, 2] from answer text
    const matches = Array.from(answerText.matchAll(/\[(\d+)\]/g));
    
    // Extract unique 1-based index numbers cited by LLM in order of appearance
    const cited1BasedIndices: number[] = [];
    for (const match of matches) {
      const idx = parseInt(match[1], 10);
      if (idx >= 1 && idx <= chunks.length && !cited1BasedIndices.includes(idx)) {
        cited1BasedIndices.push(idx);
      }
    }

    // 2. If explicit citations were matched in the answer text:
    if (cited1BasedIndices.length > 0) {
      const oldToNewIndexMap = new Map<number, number>();
      const usedCitations: CitationItem[] = [];

      cited1BasedIndices.forEach((oldIdx, newSeqIdx) => {
        const newCitationId = newSeqIdx + 1;
        oldToNewIndexMap.set(oldIdx, newCitationId);

        const chunk = chunks[oldIdx - 1];
        if (chunk) {
          usedCitations.push({
            citationId: newCitationId,
            chunkId: chunk.chunkId,
            sourceId: chunk.sourceId,
            sourceTitle: chunk.sourceTitle ?? "Untitled Source",
            sourceType: chunk.sourceType ?? "DOCUMENT",
            locationMetadata: chunk.locationMetadata,
            snippet:
              chunk.content.length > 150
                ? `${chunk.content.slice(0, 150)}...`
                : chunk.content,
          });
        }
      });

      // Re-map citation numbers in answer text if numbering shifted
      const cleanedAnswer = answerText.replace(/\[(\d+)\]/g, (match, p1) => {
        const oldNum = parseInt(p1, 10);
        const newNum = oldToNewIndexMap.get(oldNum);
        return newNum ? `[${newNum}]` : match;
      });

      return { cleanedAnswer, citations: usedCitations };
    }

    // 3. Fallback: If LLM didn't produce bracket markers [N], deduplicate sources and return top 2 most relevant chunks
    const deduplicatedChunks: ScoredChunk[] = [];
    const seenSourceIds = new Set<string>();

    for (const chunk of chunks) {
      if (!seenSourceIds.has(chunk.sourceId)) {
        seenSourceIds.add(chunk.sourceId);
        deduplicatedChunks.push(chunk);
      }
      if (deduplicatedChunks.length >= 2) break;
    }

    const fallbackCitations = deduplicatedChunks.map((chunk, index) => ({
      citationId: index + 1,
      chunkId: chunk.chunkId,
      sourceId: chunk.sourceId,
      sourceTitle: chunk.sourceTitle ?? "Untitled Source",
      sourceType: chunk.sourceType ?? "DOCUMENT",
      locationMetadata: chunk.locationMetadata,
      snippet:
        chunk.content.length > 150
          ? `${chunk.content.slice(0, 150)}...`
          : chunk.content,
    }));

    return { cleanedAnswer: answerText, citations: fallbackCitations };
  }


  static async answerQuestion(
    userId: string,
    notebookId: string,
    userQuery: string,
    onToken?: (token: string) => Promise<void> | void
  ): Promise<RAGAnswerResult> {
    const expandedQueries = await this.expandQuery(userQuery);

    const { scoredChunks } =
      await RetrievalService.searchNotebookChunks(
        userId,
        notebookId,
        expandedQueries,
        10,
        10
      );

    // Step 3 - Low confidence retrieval
    if (
      scoredChunks.length === 0 ||
      scoredChunks[0].rerankScore <
      this.LOW_CONFIDENCE_THRESHOLD
    ) {
      const fallback =
        "I couldn't find sufficient information in the notebook's sources to answer your question confidently.";

      console.warn(
        `[RAGService] Low confidence retrieval for notebook ${notebookId}`
      );

      if (onToken) {
        await onToken(fallback);
      }

      return {
        answer: fallback,
        citations: [],
        isLowConfidence: true,
        retryAttempts: 0,
      };
    }

    const MAX_RETRIES = 2;

    let selectedChunks = scoredChunks.slice(0, 6);

    for (
      let attempt = 0;
      attempt <= MAX_RETRIES;
      attempt++
    ) {
      switch (attempt) {
        case 1:
          selectedChunks = scoredChunks.slice(0, 8);

          console.log(
            "[RAGService] Retry #1 - widening context."
          );

          break;

        case 2:
          selectedChunks = scoredChunks.slice(0, 4);

          console.log(
            "[RAGService] Retry #2 - narrowing context."
          );

          break;
      }

      // Build Context
      const context = selectedChunks
        .map(
          (chunk, index) => `
[Source ${index + 1}]
Title: ${chunk.sourceTitle}
Type: ${chunk.sourceType}
Location: ${JSON.stringify(
            chunk.locationMetadata
          )}

${chunk.content}`
        )
        .join("\n\n-----------------------\n\n");

      const systemPrompt = `
You are ChatSource, an AI notebook assistant.

Answer ONLY using the provided source passages.

Rules:

- Never use outside knowledge.
- Cite every factual statement using [1], [2], etc.
- If the answer is unavailable in the sources,
  clearly state that.
- Be concise.
`;

      const prompt = [
        {
          role: "system" as const,
          content: systemPrompt,
        },
        {
          role: "user" as const,
          content: `Source Passages:

${context}

User Question:

${userQuery}`,
        },
      ];

      let answer = "";

      if (onToken) {
        answer =
          await this.llm.streamCompletion(
            prompt,
            onToken,
            {
              temperature: 0,
            }
          );
      } else {
        answer =
          await this.llm.generateCompletion(
            prompt,
            {
              temperature: 0,
            }
          );
      }

      const judge =
        await this.judgeAnswer(
          userQuery,
          context,
          answer
        );

      console.log(
        `[RAGService] Attempt ${attempt} | Faithfulness=${judge.faithfulnessScore} | Relevance=${judge.relevanceScore}`
      );

      if (
        judge.faithfulnessScore >= 0.7 &&
        judge.relevanceScore >= 0.7
      ) {
        const { cleanedAnswer, citations } = this.filterAndBuildUsedCitations(
          answer,
          selectedChunks
        );

        return {
          answer: cleanedAnswer,
          citations,
          isLowConfidence: false,
          faithfulnessScore:
            judge.faithfulnessScore,
          relevanceScore:
            judge.relevanceScore,
          retryAttempts: attempt,
        };
      }
    }

    console.warn(
      "[RAGService] Retry budget exhausted."
    );

    return {
      answer:
        "I couldn't find sufficient information in the notebook's sources to answer your question confidently.",
      citations: [],
      isLowConfidence: true,
      retryAttempts: MAX_RETRIES,
    };
  }
}

