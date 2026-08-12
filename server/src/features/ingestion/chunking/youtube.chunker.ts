import { ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';

export interface YouTubeTranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

export function formatTimestamp(totalSeconds: number): string {
  const secs = Math.floor(Math.max(0, totalSeconds));
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSecs = secs % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(remainingSecs)}`;
  }
  return `${pad(minutes)}:${pad(remainingSecs)}`;
}

/**
 * Estimates token count for a text snippet using word/character subword heuristic.
 * Approximately 1 token per 4 characters or ~1.3 tokens per whitespace-delimited word.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const wordCount = text.trim().split(/\s+/).length;
  const charEstimate = Math.ceil(text.length / 4);
  return Math.max(wordCount, charEstimate);
}

export function normalizeTranscriptItems(
  items: YouTubeTranscriptItem[]
): YouTubeTranscriptItem[] {
  if (!items || items.length === 0) return [];

  const lastItem = items[items.length - 1];
  const isMilliseconds =
    lastItem.offset > 10000 ||
    (items.length > 1 && (items[1].offset - items[0].offset) > 100);

  return items.map((item) => {
    const rawOffset = item.offset;
    const rawDuration = item.duration;

    const offsetInSeconds = isMilliseconds ? rawOffset / 1000 : rawOffset;
    const durationInSeconds = isMilliseconds ? rawDuration / 1000 : rawDuration;

    return {
      text: item.text,
      offset: Math.max(0, offsetInSeconds),
      duration: Math.max(0, durationInSeconds),
    };
  });
}


export async function chunkYoutubeDocument(
  document: ExtractedDocument,
  maxChunkSize = 1000,
  overlapSize = 150
): Promise<ProcessedChunk[]> {
  const chunks: ProcessedChunk[] = [];
  let chunkIndex = 0;

  const rawTranscriptItems = (document.sourceMetadata.transcriptItems as YouTubeTranscriptItem[]) || [];
  const transcriptItems = normalizeTranscriptItems(rawTranscriptItems);
  const videoId = (document.sourceMetadata.videoId as string) || '';
  const videoUrl = (document.sourceMetadata.url as string) || `https://www.youtube.com/watch?v=${videoId}`;
  const videoTitle = document.title || 'YouTube Video';

  // Fallback if no structured transcript items are available
  if (!transcriptItems || transcriptItems.length === 0) {
    if (document.fullText) {
      chunks.push({
        content: document.fullText,
        chunkIndex: 0,
        tokenCount: estimateTokenCount(document.fullText),
        locationMetadata: {
          url: videoUrl,
          videoId,
          startTime: 0,
          endTime: 0,
          timestampFormatted: '00:00',
          sectionTitle: videoTitle,
        },
      });
    }
    return chunks;
  }

  // Token targets: ~250 tokens per chunk (~1000 chars), ~40 tokens overlap (~150 chars)
  const maxTokens = Math.max(100, Math.ceil(maxChunkSize / 4));
  const targetOverlapTokens = Math.max(20, Math.ceil(overlapSize / 4));

  let currentItems: YouTubeTranscriptItem[] = [];
  let currentTokenCount = 0;

  for (let i = 0; i < transcriptItems.length; i++) {
    const item = transcriptItems[i];
    const cleanText = item.text.trim();
    if (!cleanText) continue;

    const itemTokens = estimateTokenCount(cleanText);
    const nextItem = i < transcriptItems.length - 1 ? transcriptItems[i + 1] : null;

    // Detect natural boundaries
    const endsWithPunctuation = /[.?!;:](?:\s+|$)/.test(cleanText);
    const pauseGap = nextItem ? (nextItem.offset - (item.offset + item.duration)) : 0;
    const isNaturalPause = pauseGap >= 1.2;

    currentItems.push(item);
    currentTokenCount += itemTokens;

    // Decide whether to close the current chunk
    const isExceedingSoftLimit = currentTokenCount >= maxTokens * 0.85;
    const isExceedingHardLimit = currentTokenCount >= maxTokens;
    const isNaturalBreakPoint = (endsWithPunctuation || isNaturalPause) && isExceedingSoftLimit;

    if (isNaturalBreakPoint || isExceedingHardLimit || i === transcriptItems.length - 1) {
      if (currentItems.length > 0) {
        const chunkContent = currentItems.map((it) => it.text.trim()).join(' ');
        const startOffset = currentItems[0].offset;
        const lastItem = currentItems[currentItems.length - 1];
        const endOffset = lastItem.offset + lastItem.duration;

        const startSeconds = Math.floor(startOffset);
        const endSeconds = Math.ceil(endOffset);
        const timestampFormatted = formatTimestamp(startSeconds);
        const timestampEndFormatted = formatTimestamp(endSeconds);

        const timestampUrl = `https://www.youtube.com/watch?v=${videoId}&t=${startSeconds}s`;

        chunks.push({
          content: chunkContent,
          chunkIndex: chunkIndex++,
          tokenCount: estimateTokenCount(chunkContent),
          locationMetadata: {
            url: timestampUrl,
            videoId,
            startTime: startSeconds,
            endTime: endSeconds,
            timestampFormatted,
            timestampEndFormatted,
            sectionTitle: `${videoTitle} (${timestampFormatted})`,
          },
        });

        // Compute transcript overlap for next chunk
        let overlapTokens = 0;
        const overlapItems: YouTubeTranscriptItem[] = [];

        for (let j = currentItems.length - 1; j >= 0; j--) {
          const tItem = currentItems[j];
          const tTokens = estimateTokenCount(tItem.text);
          if (overlapTokens + tTokens > targetOverlapTokens && overlapItems.length > 0) {
            break;
          }
          overlapItems.unshift(tItem);
          overlapTokens += tTokens;
        }

        // Initialize next chunk with overlapping items unless we reached end of transcript
        if (i < transcriptItems.length - 1) {
          currentItems = [...overlapItems];
          currentTokenCount = overlapTokens;
        } else {
          currentItems = [];
          currentTokenCount = 0;
        }
      }
    }
  }

  return chunks;
}

