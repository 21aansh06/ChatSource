import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { env } from '../../../config/env.js';
import { generatedQuizSchema } from '../schemas/quiz.schema.js';
import { IQuizLLMProvider, QuizPromptContext, QuizLLMResult } from './quiz-llm.interface.js';

export class OpenAIQuizLLMProvider implements IQuizLLMProvider {
  readonly providerName = 'openai';
  readonly defaultModel = env.OPENAI_MODEL_CHAT || 'gpt-4o-mini';

  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async generateQuiz(context: QuizPromptContext): Promise<QuizLLMResult> {
    const systemPrompt = `You are a world-class academic tutor and active-recall assessment designer.
Generate an active-recall multiple-choice quiz derived strictly from the provided source context.

Instructions:
1. Generate exactly ${context.questionCount} questions.
2. Target difficulty: ${context.difficulty}.
   - EASY: Direct factual recall, core definitions, and explicit statements.
   - MEDIUM: Conceptual comprehension, cause-and-effect, and cross-section synthesis.
   - HARD: Nuanced application, edge cases, subtle distinctions, and critical evaluation.
3. Every question must have exactly 4 plausible options (A, B, C, D) with exactly one unequivocally correct option.
4. Provide a rich, educational explanation that clarifies why the correct option is right and why the distractors are incorrect.
5. In locationHint, reference the specific section, page, or timestamp where this knowledge was found in the text (e.g., 'Page 4', 'Timestamp 12:45', 'Section: Key Principles').
6. Ensure comprehensive coverage across the entire provided material, avoiding clustering around only one section.`;

    const userPrompt = `Source: "${context.sourceTitle}" (${context.sourceType})

--- REFERENCE MATERIAL (STRATIFIED SAMPLE) ---
${context.sampledContext}
--- END REFERENCE MATERIAL ---

Generate the active-recall quiz strictly conforming to the structured schema.`;

    // Native OpenAI Structured Outputs API with zodResponseFormat
    const completion = await this.client.beta.chat.completions.parse({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: zodResponseFormat(generatedQuizSchema, 'generatedQuiz'),
      temperature: 0.2,
    });

    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      const refusal = completion.choices[0]?.message?.refusal;
      if (refusal) {
        throw new Error(`[OpenAIQuizLLMProvider] Model refused request: ${refusal}`);
      }
      throw new Error('[OpenAIQuizLLMProvider] OpenAI returned empty parsed structured output.');
    }

    return {
      quiz: parsed,
      usage: {
        promptTokens: completion.usage?.prompt_tokens ?? 0,
        completionTokens: completion.usage?.completion_tokens ?? 0,
        totalTokens: completion.usage?.total_tokens ?? 0,
      },
      provider: this.providerName,
      model: this.defaultModel,
    };
  }
}
