import OpenAI from "openai";
import { env } from "../../../config/env.js";
import { ChatMessagePrompt, LLMProvider } from "./llm.provider.js";

export class OpenAILLMProvider implements LLMProvider {
  readonly name = "openai";

  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });

    this.defaultModel = env.OPENAI_MODEL_CHAT; 
  }

  /**
   * Standard Chat Completion
   */
  async generateCompletion(
    messages: ChatMessagePrompt[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,

      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),

      temperature: options?.temperature ?? 0,

      max_completion_tokens: options?.maxTokens ?? 1000,
    });

    return response.choices[0]?.message?.content?.trim() ?? "";
  }

  /**
   * Streaming Completion
   */
  async streamCompletion(
    messages: ChatMessagePrompt[],
    onToken: (token: string) => Promise<void> | void,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,

      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),

      temperature: options?.temperature ?? 0,

      max_completion_tokens: options?.maxTokens ?? 1000,

      stream: true,
    });

    let fullText = "";

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content ?? "";

      if (!token) continue;

      fullText += token;

      await onToken(token);
    }

    return fullText;
  }

  /**
   * Structured JSON Generation
   *
   * Uses JSON Mode.
   * Validation is handled in RAGService using Zod.
   */
  async generateStructuredJSON<T>(
    messages: ChatMessagePrompt[],
    options?: {
      temperature?: number;
      model?: string;
    }
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,

      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),

      temperature: options?.temperature ?? 0,

      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("[OpenAILLMProvider] OpenAI returned an empty JSON response.");
    }

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(
        `[OpenAILLMProvider] Failed to parse JSON response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}