import { ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';

/**
 * Section & DOM Paragraph-Aware Website Chunker.
 * Rationale: Web pages consist of articles, headings (H1-H4), and semantic DOM sections.
 * This chunker splits text along structural section headings and paragraphs, preserving
 * the source URL, section title, and character offsets in citation locationMetadata.
 */
export async function chunkWebsiteDocument(
  document: ExtractedDocument,
  maxChunkSize = 1000,
  overlap = 150
): Promise<ProcessedChunk[]> {
  const chunks: ProcessedChunk[] = [];
  let chunkIndex = 0;
  const fullText = document.fullText;
  const url = (document.sourceMetadata.url as string) || '';

  const sections = fullText.split(/(?=\n#{1,4}\s)/);

  let charOffsetCursor = 0;

  for (const section of sections) {
    const trimmedSection = section.trim();
    if (!trimmedSection) continue;

    const headingMatch = trimmedSection.match(/^(#{1,4})\s+(.+)$/m);
    const sectionTitle = headingMatch ? headingMatch[2].trim() : (document.title || 'Web Page Content');

    let currentChunk = '';
    let chunkStartOffset = charOffsetCursor;

    const paragraphs = trimmedSection.split(/\n\s*\n/);

    for (const para of paragraphs) {
      const cleanPara = para.trim();
      if (!cleanPara) continue;

      if (currentChunk.length + cleanPara.length + 2 <= maxChunkSize) {
        currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + cleanPara;
      } else {
        if (currentChunk.length > 0) {
          chunks.push({
            content: currentChunk,
            chunkIndex: chunkIndex++,
            tokenCount: Math.ceil(currentChunk.length / 4),
            locationMetadata: {
              url,
              sectionTitle,
              charOffsetStart: chunkStartOffset,
              charOffsetEnd: chunkStartOffset + currentChunk.length,
            },
          });
        }

        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText ? overlapText + '\n\n' + cleanPara : cleanPara;
        chunkStartOffset = Math.max(0, charOffsetCursor - overlapText.length);
      }
    }

    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk,
        chunkIndex: chunkIndex++,
        tokenCount: Math.ceil(currentChunk.length / 4),
        locationMetadata: {
          url,
          sectionTitle,
          charOffsetStart: chunkStartOffset,
          charOffsetEnd: chunkStartOffset + currentChunk.length,
        },
      });
    }

    charOffsetCursor += section.length;
  }

  return chunks;
}
