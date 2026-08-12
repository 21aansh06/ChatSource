import { Source, SourceType } from '@prisma/client';
import { YoutubeTranscript } from 'youtube-transcript';
import { IngestionHandler, ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';
import { chunkYoutubeDocument } from '../chunking/youtube.chunker.js';

/**
 * Robust YouTube Video ID extractor matching standard, short, mobile, and embed URLs.
 */
export function extractYoutubeVideoId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match ? match[1] : null;
}

/**
 * Fetch video metadata title via YouTube oEmbed service.
 */
async function fetchYoutubeTitle(videoId: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(oembedUrl);
    if (res.ok) {
      const data: any = await res.json();
      if (data?.title && typeof data.title === 'string') {
        return data.title.trim();
      }
    }
  } catch (err) {
    console.warn(`[YouTubeIngestionHandler] Failed to fetch oEmbed title for video ${videoId}:`, err);
  }
  return null;
}

/**
 * Normalizes transcript item offsets & durations to seconds.
 * YouTube caption XML formats return either milliseconds (srv3 format: e.g. offset = 468000ms)
 * or floating-point seconds (classic format: e.g. offset = 468.0s).
 */
export function normalizeTranscriptItems(
  items: Array<{ text: string; offset: number; duration: number }>
): Array<{ text: string; offset: number; duration: number }> {
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

export class YouTubeIngestionHandler implements IngestionHandler {
  readonly sourceType = SourceType.YOUTUBE;

  async extractContent(source: Source): Promise<ExtractedDocument> {
    const rawUrl = source.url;
    if (!rawUrl) {
      throw new Error(`[YouTubeIngestionHandler] Source ${source.id} is missing target YouTube URL.`);
    }

    const videoId = extractYoutubeVideoId(rawUrl);
    if (!videoId) {
      throw new Error(`[YouTubeIngestionHandler] Could not extract valid YouTube video ID from URL: ${rawUrl}`);
    }

    console.log(`[YouTubeIngestionHandler] Ingesting YouTube videoId: ${videoId}...`);

    // 1. Fetch Video Title via oEmbed API
    const fetchedTitle = await fetchYoutubeTitle(videoId);
    const title = fetchedTitle || source.title || `YouTube Video (${videoId})`;

    // 2. Fetch Transcript via YoutubeTranscript SDK
    let rawTranscriptItems;
    try {
      rawTranscriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    } catch (err: any) {
      console.error(`[YouTubeIngestionHandler] YoutubeTranscript error for ${videoId}:`, err?.message || err);
      throw new Error(`[YouTubeIngestionHandler] Failed to fetch transcript for YouTube video ${videoId}. ${err?.message || 'No captions available.'}`);
    }

    if (!rawTranscriptItems || rawTranscriptItems.length === 0) {
      throw new Error(`[YouTubeIngestionHandler] YouTube video ${videoId} returned empty transcript.`);
    }

    // Normalize timestamps to seconds (handles both ms and s units cleanly)
    const transcriptItems = normalizeTranscriptItems(rawTranscriptItems);
    const fullText = transcriptItems.map((item) => item.text.trim()).join(' ');

    return {
      sourceId: source.id,
      notebookId: source.notebookId,
      userId: source.userId,
      title,
      sourceType: SourceType.YOUTUBE,
      pages: [{ pageNumber: 1, text: fullText }],
      fullText,
      sourceMetadata: {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        videoId,
        extractedTitle: title,
        transcriptItems,
      },
    };
  }

  async chunkDocument(document: ExtractedDocument): Promise<ProcessedChunk[]> {
    return chunkYoutubeDocument(document);
  }
}

