import OpenAI from 'openai';
import { env } from '../../../config/env.js';
import { LLMProvider, ChatMessagePrompt } from './llm.provider.js';

export class GeminiLLMProvider implements LLMProvider {
  readonly name = 'gemini';

  private client: OpenAI;
  private defaultModel: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
    });

    this.defaultModel = env.GEMINI_MODEL_CHAT || 'gemini-3.5-flash';
  }

  async generateCompletion(
    messages: ChatMessagePrompt[],
    options?: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    }
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.2,
      max_completion_tokens: options?.maxTokens ?? 1000,
    });

    return response.choices[0]?.message?.content?.trim() || '';
  }

  async streamCompletion(
    messages: ChatMessagePrompt[],
    onToken: (token: string) => Promise<void> | void,
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.2,
      max_completion_tokens: options?.maxTokens ?? 1000,
      stream: true,
    });

    let fullText = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        await onToken(content);
      }
    }

    return fullText;
  }

  async generateStructuredJSON<T>(
    messages: ChatMessagePrompt[],
    options?: {
      temperature?: number;
      model?: string;
    }
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.0,
      response_format: {
        type: 'json_object',
      },
    });

    const content = response.choices[0]?.message?.content || '{}';

    try {
      return JSON.parse(content) as T;
    } catch (err: any) {
      throw new Error(
        `[GeminiLLMProvider] Failed to parse JSON completion: ${err?.message}\nResponse:\n${content}`
      );
    }
  }
}
