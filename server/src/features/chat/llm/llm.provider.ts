export interface ChatMessagePrompt {
  role: 'system' | 'user' | 'assistant';
  content: string;
}


export interface LLMProvider {
  readonly name: string;

  generateCompletion(
    messages: ChatMessagePrompt[],
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<string>;

  generateStructuredJSON<T>(
    messages: ChatMessagePrompt[],
    options?: { temperature?: number; model?: string }
  ): Promise<T>;
}
