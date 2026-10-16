import OpenAI from 'openai';
import { env } from '../../../config/env.js';
import { generatedQuizSchema } from '../schemas/quiz.schema.js';
import { IQuizLLMProvider, QuizPromptContext, QuizLLMResult } from './quiz-llm.interface.js';

export class GeminiQuizLLMProvider implements IQuizLLMProvider {
  readonly providerName = 'gemini';
  readonly defaultModel = process.env.GEMINI_MODEL_QUIZ || 'gemini-3.8-flash';

  private readonly client: OpenAI;

  constructor() {
    if (!env.GEMINI_API_KEY) {
      throw new Error('[GeminiQuizLLMProvider] GEMINI_API_KEY is not configured in environment variables.');
    }

    this.client = new OpenAI({
      apiKey: env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
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
4. Provide a rich, educational explanation that clarifies why the correct option is right and why distractors are wrong.
5. In locationHint, reference the specific section, page, or timestamp where this knowledge was found in the text (e.g., 'Page 4', 'Timestamp 12:45', 'Section: Key Principles').
6. You MUST return ONLY a valid JSON object matching the following structure:
{
  "title": string,
  "summary": string,
  "questions": [
    {
      "id": string (UUID),
      "question": string,
      "options": [string, string, string, string],
      "correctOptionIndex": number (0 to 3),
      "explanation": string,
      "locationHint": string,
      "difficulty": "${context.difficulty}"
    }
  ]
}`;

    const userPrompt = `Source: "${context.sourceTitle}" (${context.sourceType})

--- REFERENCE MATERIAL (STRATIFIED SAMPLE) ---
${context.sampledContext}
--- END REFERENCE MATERIAL ---

Generate the active-recall quiz strictly as valid JSON.`;

    const response = await this.client.chat.completions.create({
      model: this.defaultModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const rawContent = response.choices[0]?.message?.content?.trim() || '{}';
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawContent);
    } catch (parseErr) {
      throw new Error(`[GeminiQuizLLMProvider] Failed to parse JSON response: ${(parseErr as Error).message}\nRaw: ${rawContent}`);
    }

    const validated = generatedQuizSchema.parse(parsedJson);

    return {
      quiz: validated,
      usage: {
        promptTokens: response.usage?.prompt_tokens ?? 0,
        completionTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
      },
      provider: this.providerName,
      model: this.defaultModel,
    };
  }
}
