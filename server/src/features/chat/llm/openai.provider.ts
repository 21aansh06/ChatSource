import OpenAI from "openai";
import { env } from "../../../config/env.js";
import { ChatMessagePrompt, LLMProvider } from "./llm.provider.js";

export interface LLMTokenUsage {
  promptTokens: number;
  completionTokens: number;
}

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
   * Standard Chat Completion with Token Usage
   */
  async generateCompletionWithUsage(
    messages: ChatMessagePrompt[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<{ text: string; usage: LLMTokenUsage }> {
    const response = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0,
      max_completion_tokens: options?.maxTokens ?? 1000,
    });

    return {
      text: response.choices[0]?.message?.content?.trim() ?? "",
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }

  async generateCompletion(
    messages: ChatMessagePrompt[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    const res = await this.generateCompletionWithUsage(messages, options);
    return res.text;
  }

  /**
   * Streaming Completion with Token Usage
   */
  async streamCompletionWithUsage(
    messages: ChatMessagePrompt[],
    onToken: (token: string) => Promise<void> | void,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<{ text: string; usage: LLMTokenUsage }> {
    const stream = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0,
      max_completion_tokens: options?.maxTokens ?? 1000,
      stream: true,
      stream_options: { include_usage: true },
    });

    let fullText = "";
    let promptTokens = 0;
    let completionTokens = 0;

    for await (const chunk of stream) {
      if (chunk.usage) {
        promptTokens = chunk.usage.prompt_tokens ?? 0;
        completionTokens = chunk.usage.completion_tokens ?? 0;
      }
      const token = chunk.choices[0]?.delta?.content ?? "";
      if (!token) continue;
      fullText += token;
      await onToken(token);
    }

    return {
      text: fullText,
      usage: { promptTokens, completionTokens },
    };
  }

  async streamCompletion(
    messages: ChatMessagePrompt[],
    onToken: (token: string) => Promise<void> | void,
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    const res = await this.streamCompletionWithUsage(messages, onToken, options);
    return res.text;
  }

  /**
   * Structured JSON Generation with Token Usage
   */
  async generateStructuredJSONWithUsage<T>(
    messages: ChatMessagePrompt[],
    options?: {
      temperature?: number;
      model?: string;
    }
  ): Promise<{ data: T; usage: LLMTokenUsage }> {
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

    let data: T;
    try {
      data = JSON.parse(content) as T;
    } catch (error) {
      throw new Error(
        `[OpenAILLMProvider] Failed to parse JSON response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }

    return {
      data,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
      },
    };
  }

  async generateStructuredJSON<T>(
    messages: ChatMessagePrompt[],
    options?: {
      temperature?: number;
      model?: string;
    }
  ): Promise<T> {
    const res = await this.generateStructuredJSONWithUsage<T>(messages, options);
    return res.data;
  }
}