import OpenAI from 'openai';
import { env } from '../../../config/env.js';
import { LLMProvider, ChatMessagePrompt } from './llm.provider.js';
export class OpenAILLMProvider implements LLMProvider {
  readonly name = 'openai';
  private client: OpenAI;
  private defaultModel: string;
  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY || 'sk-dummy-key-for-local-parity',
    });
    this.defaultModel = env.OPENAI_MODEL_CHAT || 'gpt-4o-mini';
  }
  async generateCompletion(
    messages: ChatMessagePrompt[],
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.2,
      max_completion_tokens: options?.maxTokens ?? 1000
    });
    return response.choices[0]?.message?.content?.trim() || '';
  }
  async generateStructuredJSON<T>(
    messages: ChatMessagePrompt[],
    options?: { temperature?: number; model?: string }
  ): Promise<T> {
    const response = await this.client.chat.completions.create({
      model: options?.model || this.defaultModel,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.0,
      response_format: { type: 'json_object' },
    });
    const content = response.choices[0]?.message?.content || '{}';
    try {
      return JSON.parse(content) as T;
    } catch (err: any) {
      throw new Error(`[OpenAILLMProvider] Failed to parse JSON completion: ${err?.message}`);
    }
  }
}