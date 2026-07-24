import { ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';

export async function chunkTextDocument(
  document: ExtractedDocument,
  maxChunkSize = 1000,
  overlap = 150
): Promise<ProcessedChunk[]> {
  const chunks: ProcessedChunk[] = [];
  let chunkIndex = 0;
  const lines = document.fullText.split(/\r?\n/);

  let currentChunkLines: string[] = [];
  let currentChunkLength = 0;
  let lineStart = 1;
  let charOffsetStart = 0;
  let charCursor = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLength = line.length + 1; 

    if (currentChunkLength + lineLength <= maxChunkSize || currentChunkLines.length === 0) {
      if (currentChunkLines.length === 0) {
        lineStart = i + 1;
        charOffsetStart = charCursor;
      }
      currentChunkLines.push(line);
      currentChunkLength += lineLength;
    } else {
      // Emit current chunk
      const content = currentChunkLines.join('\n');
      const lineEnd = i;
      const charOffsetEnd = charOffsetStart + content.length;

      chunks.push({
        content,
        chunkIndex: chunkIndex++,
        tokenCount: Math.ceil(content.length / 4),
        locationMetadata: {
          lineStart,
          lineEnd,
          charOffsetStart,
          charOffsetEnd,
        },
      });
      
      currentChunkLines = [line];
      currentChunkLength = lineLength;
      lineStart = i + 1;
      charOffsetStart = charCursor;
    }

    charCursor += lineLength;
  }

  // Flush remaining lines
  if (currentChunkLines.length > 0) {
    const content = currentChunkLines.join('\n');
    const lineEnd = lines.length;
    const charOffsetEnd = charOffsetStart + content.length;

    chunks.push({
      content,
      chunkIndex: chunkIndex++,
      tokenCount: Math.ceil(content.length / 4),
      locationMetadata: {
        lineStart,
        lineEnd,
        charOffsetStart,
        charOffsetEnd,
      },
    });
  }

  return chunks;
}
