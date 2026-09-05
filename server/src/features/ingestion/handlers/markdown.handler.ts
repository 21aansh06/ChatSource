import { Source, SourceType } from '@prisma/client';
import { IngestionHandler, ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';
import { chunkMarkdownDocument } from '../chunking/markdown.chunker.js';
import { StorageService } from '../../storage/storage.service.js';

export class MarkdownIngestionHandler implements IngestionHandler {
  readonly sourceType = SourceType.MARKDOWN;

  /**
   * Parses YAML frontmatter if present at the top of markdown document
   */
  private extractFrontmatter(rawContent: string): {
    cleanContent: string;
    frontmatter: Record<string, string>;
  } {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
    const match = rawContent.match(frontmatterRegex);

    if (!match) {
      return { cleanContent: rawContent, frontmatter: {} };
    }

    const yamlBlock = match[1];
    const cleanContent = rawContent.replace(frontmatterRegex, '');
    const frontmatter: Record<string, string> = {};

    yamlBlock.split('\n').forEach((line) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && value) {
          frontmatter[key] = value;
        }
      }
    });

    return { cleanContent, frontmatter };
  }

  async extractContent(source: Source): Promise<ExtractedDocument> {
    let rawContent = '';

    if (source.fileKey) {
      console.log(`[MarkdownIngestionHandler] Downloading .md file from storage key: ${source.fileKey}`);
      const buffer = await StorageService.download(source.fileKey);
      rawContent = buffer.toString('utf-8');
    } else if (source.rawText) {
      rawContent = source.rawText;
    } else {
      throw new Error(`[MarkdownIngestionHandler] No fileKey or rawText provided for source ${source.id}`);
    }

    if (!rawContent.trim()) {
      throw new Error(`[MarkdownIngestionHandler] Markdown content is empty for source ${source.id}`);
    }

    // Extract frontmatter metadata (title, author, tags)
    const { cleanContent, frontmatter } = this.extractFrontmatter(rawContent);

    // Document title resolution: Frontmatter title -> Source title
    const documentTitle = frontmatter.title || source.title;

    return {
      sourceId: source.id,
      notebookId: source.notebookId,
      userId: source.userId,
      title: documentTitle,
      sourceType: SourceType.MARKDOWN,
      pages: [{ pageNumber: 1, text: cleanContent }],
      fullText: cleanContent,
      sourceMetadata: {
        frontmatter,
        originalCharLength: rawContent.length,
        cleanCharLength: cleanContent.length,
        hasFrontmatter: Object.keys(frontmatter).length > 0,
        fileKey: source.fileKey,
      },
    };
  }

  async chunkDocument(document: ExtractedDocument): Promise<ProcessedChunk[]> {
    return chunkMarkdownDocument(document);
  }
}
