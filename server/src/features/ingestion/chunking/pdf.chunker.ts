import { ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';

export async function chunkPDFDocument(
  document: ExtractedDocument,
  maxChunkSize = 1000,
  overlap = 150
): Promise<ProcessedChunk[]> {
  const chunks: ProcessedChunk[] = [];
  let globalChunkIndex = 0;

  for (const page of document.pages) {
    const pageNum = page.pageNumber || 1;
    const pageText = page.text.trim();

    if (!pageText) continue;

    // Split page text by paragraph breaks
    const paragraphs = pageText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

    let currentChunkText = '';
    let startCharOffset = 0;
    let currentCharOffset = 0;

    for (const paragraph of paragraphs) {
      const cleanPara = paragraph.trim();

      if (currentChunkText.length + cleanPara.length + 2 <= maxChunkSize) {
        if (currentChunkText.length === 0) {
          startCharOffset = currentCharOffset;
        }
        currentChunkText += (currentChunkText.length > 0 ? '\n\n' : '') + cleanPara;
      } else {
        // Emit current chunk
        if (currentChunkText.length > 0) {
          chunks.push({
            content: currentChunkText,
            chunkIndex: globalChunkIndex++,
            tokenCount: Math.ceil(currentChunkText.length / 4), // Approx 4 chars per token
            locationMetadata: {
              pageNumber: pageNum,
              charOffsetStart: startCharOffset,
              charOffsetEnd: startCharOffset + currentChunkText.length,
            },
          });
        }

        // Start new chunk with overlap if applicable
        const overlapText = currentChunkText.slice(-overlap);
        currentChunkText = overlapText.length > 0 ? overlapText + '\n\n' + cleanPara : cleanPara;
        startCharOffset = Math.max(0, currentCharOffset - overlapText.length);
      }

      currentCharOffset += cleanPara.length + 2;
    }

    // Flush trailing text for the page
    if (currentChunkText.length > 0) {
      chunks.push({
        content: currentChunkText,
        chunkIndex: globalChunkIndex++,
        tokenCount: Math.ceil(currentChunkText.length / 4),
        locationMetadata: {
          pageNumber: pageNum,
          charOffsetStart: startCharOffset,
          charOffsetEnd: startCharOffset + currentChunkText.length,
        },
      });
    }
  }

  return chunks;
}
