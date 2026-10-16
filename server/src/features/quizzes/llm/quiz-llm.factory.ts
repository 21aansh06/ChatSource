import { IQuizLLMProvider } from './quiz-llm.interface.js';
import { OpenAIQuizLLMProvider } from './openai.provider.js';
import { GeminiQuizLLMProvider } from './gemini.provider.js';

export type SupportedQuizProvider = 'openai' | 'gemini';

/**
 * Factory and registry for Quiz LLM Providers.
 * Enables zero-downtime provider switching via config or runtime parameters.
 */
export class QuizLLMFactory {
  private static providers = new Map<SupportedQuizProvider, IQuizLLMProvider>();

  static getProvider(name?: SupportedQuizProvider | string): IQuizLLMProvider {
    const requested = (name || process.env.QUIZ_LLM_PROVIDER || 'gemini').toLowerCase() as SupportedQuizProvider;

    if (!this.providers.has(requested)) {
      switch (requested) {
        case 'gemini':
          this.providers.set('gemini', new GeminiQuizLLMProvider());
          break;
        case 'openai':
        default:
          this.providers.set('openai', new OpenAIQuizLLMProvider());
          break;
      }
    }

    const provider = this.providers.get(requested);
    if (!provider) {
      throw new Error(`[QuizLLMFactory] Unknown provider requested: ${requested}`);
    }

    return provider;
  }

  /**
   * For testing or custom mocking
   */
  static registerProvider(name: SupportedQuizProvider, provider: IQuizLLMProvider): void {
    this.providers.set(name, provider);
  }
}
