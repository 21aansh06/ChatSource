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

  /**
   * Standard batch chat completion returning string text
   */
  generateCompletion(
    messages: ChatMessagePrompt[],
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<string>;

  /**
   * Streaming chat completion pushing tokens in real-time as they are generated
   */
  streamCompletion(
    messages: ChatMessagePrompt[],
    onToken: (token: string) => Promise<void> | void,
    options?: { temperature?: number; maxTokens?: number; model?: string }
  ): Promise<string>;

  /**
   * Structured JSON completion returning parsed object of type T
   */
  generateStructuredJSON<T>(
    messages: ChatMessagePrompt[],
    options?: { temperature?: number; model?: string }
  ): Promise<T>;
}
