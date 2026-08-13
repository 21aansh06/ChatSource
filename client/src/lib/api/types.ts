/**
 * Backend Data Contract Interfaces
 * Strictly mirrors the backend Prisma schemas and Express DTOs
 */

export type UserPlan = 'FREE' | 'PAID';

export interface UserProfile {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  plan: UserPlan;
  createdAt: string;
  updatedAt: string;
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

export type SourceType = 'PDF' | 'WEBSITE' | 'TEXT' | 'YOUTUBE';

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
  url?: string;
  anchorId?: string;
  sectionTitle?: string;
  lineStart?: number;
  lineEnd?: number;
  charOffsetStart?: number;
  charOffsetEnd?: number;
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
