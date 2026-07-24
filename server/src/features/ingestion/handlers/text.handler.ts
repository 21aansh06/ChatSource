import { Source, SourceType } from '@prisma/client';
import { IngestionHandler, ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';
import { chunkTextDocument } from '../chunking/text.chunker.js';

export class TextIngestionHandler implements IngestionHandler {
  readonly sourceType = SourceType.TEXT;

  async extractContent(source: Source): Promise<ExtractedDocument> {
    const rawText = source.rawText || '';

    if (!rawText.trim()) {
      throw new Error(`[TextIngestionHandler] Raw text content for source ${source.id} is empty`);
    }

    return {
      sourceId: source.id,
      notebookId: source.notebookId,
      userId: source.userId,
      title: source.title,
      sourceType: SourceType.TEXT,
      pages: [{ pageNumber: 1, text: rawText }],
      fullText: rawText,
      sourceMetadata: {
        charCount: rawText.length,
      },
    };
  }

  async chunkDocument(document: ExtractedDocument): Promise<ProcessedChunk[]> {
    return chunkTextDocument(document);
  }
}
