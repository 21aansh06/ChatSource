/**
 * Backend Data Contract Interfaces
 * Strictly mirrors the backend Prisma schemas and Express DTOs
 */

export type UserPlan = 'FREE' | 'PAID';

export interface UserUsage {
  sourcesAddedCount: number;
  successfulQueriesCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  plan: UserPlan;
  createdAt: string;
  updatedAt: string;
  usage?: UserUsage | null;
}

export interface Notebook {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotebookInput {
  title: string;
  description?: string;
}

export interface UpdateNotebookInput {
  title?: string;
  description?: string;
}

export type SourceType = 'PDF' | 'WEBSITE' | 'TEXT' | 'YOUTUBE' | 'MARKDOWN';

export type IngestionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'READY'
  | 'FAILED'
  | 'NEEDS_REVIEW';

export interface IngestionJob {
  id: string;
  stage: string;
  status: IngestionStatus;
  errorDetails?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Source {
  id: string;
  notebookId: string;
  userId: string;
  title: string;
  type: SourceType;
  status: IngestionStatus;
  statusReason?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  url?: string | null;
  rawText?: string | null;
  createdAt: string;
  updatedAt: string;
  ingestionJobs?: IngestionJob[];
}

export interface CreateSourceInput {
  title: string;
  type: SourceType;
  url?: string;
  rawText?: string;
  file?: File;
}

export interface LocationMetadata {
  pageNumber?: number;
  header?: string;
  headerLevel?: number;
  sectionBreadcrumbs?: string[];
  url?: string;
  anchorId?: string;
  sectionTitle?: string;
  lineStart?: number;
  lineEnd?: number;
  charOffsetStart?: number;
  charOffsetEnd?: number;
  hasCodeBlock?: boolean;
  hasTable?: boolean;
  codeLanguages?: string[];
  [key: string]: unknown;
}

export interface CitationItem {
  citationId: number;
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  sourceType: SourceType | string;
  locationMetadata: LocationMetadata;
  snippet: string;
}

export type ChatRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: ChatRole;
  content: string;
  citations?: CitationItem[] | null;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  notebookId: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface AskQuestionInput {
  message: string;
  sessionId?: string;
  sourceIds?: string[];
}

export interface AskQuestionResponse {
  status: 'queued';
  message: string;
  sessionId: string;
  userMessageId: string;
  streamUrl: string;
}

export interface SSEEventConnected {
  type: 'connected';
  payload: { sessionId: string };
}

export interface SSEEventToken {
  type: 'token';
  payload: { token: string };
}

export interface SSEEventCitations {
  type: 'citations';
  payload: { citations: CitationItem[] };
}

export interface SSEEventComplete {
  type: 'complete';
  payload: {
    assistantMessageId: string;
    isLowConfidence?: boolean;
  };
}

export interface SSEEventError {
  type: 'error';
  payload: { error: string };
}

export type SSEChatEvent =
  | SSEEventConnected
  | SSEEventToken
  | SSEEventCitations
  | SSEEventComplete
  | SSEEventError;

export type QuizDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type QuizStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  locationHint?: string;
  difficulty?: QuizDifficulty;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  score: number;
  totalQuestions: number;
  userAnswers: Record<string, number>;
  timeSpentSec?: number | null;
  completedAt: string;
}

export interface Quiz {
  id: string;
  sourceId: string;
  notebookId: string;
  userId: string;
  title: string;
  description?: string | null;
  status: QuizStatus;
  errorMessage?: string | null;
  difficulty: QuizDifficulty;
  totalQuestions: number;
  questions?: QuizQuestion[] | null;
  createdAt: string;
  updatedAt: string;
  attempts?: QuizAttempt[];
  source?: {
    id: string;
    title: string;
    type: SourceType;
  };
}

export interface CreateQuizInput {
  questionCount?: number;
  difficulty?: QuizDifficulty;
  provider?: 'openai' | 'gemini';
}

export interface SubmitQuizAttemptInput {
  answers: Record<string, number>;
  timeSpentSec?: number;
}

export interface QuestionGradedBreakdown {
  questionId: string;
  question: string;
  selectedOptionIndex: number | null;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation: string;
  locationHint?: string;
}

export interface QuizAttemptResult {
  attempt: QuizAttempt;
  score: number;
  totalQuestions: number;
  percentage: number;
  breakdown: QuestionGradedBreakdown[];
}
