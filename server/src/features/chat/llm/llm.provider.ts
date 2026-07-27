export interface ChatMessagePrompt {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Provider interface contract for Large Language Models.
 * Abstracted and vendor-agnostic (OpenAI, Gemini, Anthropic, etc.).
 */
export interface LLMProvider {
  readonly name: string;


  generateCompletion(
    messages: ChatMessagePrompt[],
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<string>;

  streamCompletion(
    messages: ChatMessagePrompt[],
    onToken: (token: string) => Promise<void> | void,
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<string>;
  
  generateStructuredJSON<T>(
    messages: ChatMessagePrompt[],
    options?: { temperature?: number; model?: string }
  ): Promise<T>;
}
