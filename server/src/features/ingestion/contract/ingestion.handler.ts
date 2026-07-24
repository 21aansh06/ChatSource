import { Source, SourceType } from '@prisma/client';

export interface ExtractedPage {
  pageNumber?: number;
  text: string;
}

export interface ExtractedDocument {
  sourceId: string;
  notebookId: string;
  userId: string;
  title: string;
  sourceType: SourceType;
  pages: ExtractedPage[];
  fullText: string;
  // Source-specific metadata passed to chunker
  sourceMetadata: Record<string, unknown>;
}

export interface ProcessedChunk {
  content: string;
  chunkIndex: number;
  tokenCount?: number;
  // Citation Data Concern: Exact location metadata stored as JSON
  locationMetadata: {
    pageNumber?: number;
    charOffsetStart?: number;
    charOffsetEnd?: number;
    lineStart?: number;
    lineEnd?: number;
    sectionTitle?: string;
    url?: string;
    anchorId?: string;
    [key: string]: unknown;
  };
}


export interface IngestionHandler {
  readonly sourceType: SourceType;

  extractContent(source: Source): Promise<ExtractedDocument>;
  chunkDocument(document: ExtractedDocument): Promise<ProcessedChunk[]>;
}
