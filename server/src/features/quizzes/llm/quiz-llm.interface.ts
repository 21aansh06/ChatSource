import { GeneratedQuiz } from '../schemas/quiz.schema.js';

export interface QuizPromptContext {
  sourceTitle: string;
  sourceType: string;
  sampledContext: string;
  questionCount: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface QuizLLMTokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface QuizLLMResult {
  quiz: GeneratedQuiz;
  usage: QuizLLMTokenUsage;
  provider: string;
  model: string;
}

/**
 * Abstract vendor-agnostic interface for Quiz Generation.
 * All providers (OpenAI, Gemini, Anthropic, Ollama, Groq) implement this contract.
 */
export interface IQuizLLMProvider {
  readonly providerName: string;
  readonly defaultModel: string;

  generateQuiz(context: QuizPromptContext): Promise<QuizLLMResult>;
}
