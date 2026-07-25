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
            baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
        });

        this.defaultModel = env.GEMINI_MODEL_CHAT;
        console.log("Gemini Model Initialized:", this.defaultModel);
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
            max_completion_tokens: options?.maxTokens ?? 1000
        });

        return response.choices[0]?.message?.content?.trim() || '';
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
            response_format:{
                type:"json_object"
            }
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
