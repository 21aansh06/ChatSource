import "dotenv/config";
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  QDRANT_URL: z.string().url('QDRANT_URL must be a valid URL'),
  QDRANT_API_KEY: z.string().min(1, 'QDRANT_API_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required'),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  SUPABASE_STORAGE_BUCKET: z.string(),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required').optional(),
  GEMINI_MODEL_CHAT: z.string().default('gemini-3.5-flash').optional(),

  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_EMBEDDING_MODEL: z.string().default('text-embedding-3-small'),
  OPENAI_MODEL_CHAT: z.string().default('gpt-4o-mini'),


});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Environment validation failed! Missing or invalid environment variables:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

export const env = parseResult.data;
