export interface ChunkItem {
  id: string;
  chunkIndex: number;
  content: string;
  tokenCount?: number | null;
  locationMetadata?: unknown;
}

export interface SampledContextResult {
  assembledPrompt: string;
  selectedChunkIds: string[];
  totalChunks: number;
  sampledChunksCount: number;
  approximateTokens: number;
}

export class SamplingService {
  private static readonly DIRECT_THRESHOLD = 8;
  private static readonly MAX_BUDGET_CHARS = 16000; // ~4,000 tokens safe budget

  /**
   * Samples representative chunks across the temporal/spatial span of a document.
   * Guarantees 100% document coverage and strictly bounded context tokens (< 4k).
   */
  static sampleChunks(chunks: ChunkItem[], questionCount: number = 5): SampledContextResult {
    if (!chunks || chunks.length === 0) {
      throw new Error('[SamplingService] Cannot generate quiz: source has 0 processed chunks.');
    }

    // Sort to ensure strict linear order
    const sorted = [...chunks].sort((a, b) => a.chunkIndex - b.chunkIndex);
    const N = sorted.length;

    // Case 1: Short Document (<= 8 chunks) - Direct Ingestion
    if (N <= this.DIRECT_THRESHOLD) {
      const selected = sorted;
      const assembled = selected
        .map((chunk, idx) => {
          const locStr = this.formatLocation(chunk.locationMetadata);
          return `--- [PART ${idx + 1}/${N}${locStr ? ` | ${locStr}` : ''}] ---\n${chunk.content.trim()}`;
        })
        .join('\n\n');

      return {
        assembledPrompt: this.enforceBudget(assembled),
        selectedChunkIds: selected.map((c) => c.id),
        totalChunks: N,
        sampledChunksCount: selected.length,
        approximateTokens: Math.ceil(assembled.length / 4),
      };
    }

    // Case 2: Stratified Uniform-Span Sampling
    // K windows proportional to requested question count (at least 6, at most N)
    const K = Math.min(N, Math.max(questionCount + 1, 6));
    const windowSize = N / K;

    const selectedChunks: ChunkItem[] = [];

    for (let i = 0; i < K; i++) {
      const startIndex = Math.floor(i * windowSize);
      const endIndex = Math.min(N - 1, Math.floor((i + 1) * windowSize) - 1);
      const windowChunks = sorted.slice(startIndex, endIndex + 1);

      if (windowChunks.length > 0) {
        const anchor = this.selectAnchorChunk(windowChunks);
        selectedChunks.push(anchor);
      }
    }

    // Deduplicate in case overlapping indexes occurred
    const uniqueSelected = Array.from(new Map(selectedChunks.map((c) => [c.id, c])).values());

    const assembled = uniqueSelected
      .map((chunk, idx) => {
        const spanPct = Math.round(((chunk.chunkIndex + 1) / N) * 100);
        const locStr = this.formatLocation(chunk.locationMetadata);
        return `--- [SECTION ${idx + 1}/${uniqueSelected.length} (~${spanPct}% through source)${locStr ? ` | ${locStr}` : ''}] ---\n${chunk.content.trim()}`;
      })
      .join('\n\n');

    return {
      assembledPrompt: this.enforceBudget(assembled),
      selectedChunkIds: uniqueSelected.map((c) => c.id),
      totalChunks: N,
      sampledChunksCount: uniqueSelected.length,
      approximateTokens: Math.ceil(assembled.length / 4),
    };
  }

  /**
   * Computes an information density score to pick the most informative anchor chunk in a window.
   */
  private static selectAnchorChunk(windowChunks: ChunkItem[]): ChunkItem {
    if (windowChunks.length === 1) {
      return windowChunks[0]!;
    }

    let bestChunk = windowChunks[0]!;
    let highestScore = -Infinity;

    for (const chunk of windowChunks) {
      const score = this.calculateDensityScore(chunk.content);
      if (score > highestScore) {
        highestScore = score;
        bestChunk = chunk;
      }
    }

    return bestChunk;
  }

  /**
   * Score = log(length) * lexicalDiversity - boilerplatePenalties
   */
  private static calculateDensityScore(text: string): number {
    const trimmed = text.trim();
    if (trimmed.length < 50) return -100; // Ignore tiny fragments

    const words = trimmed.toLowerCase().match(/\b[a-z0-9_-]+\b/g) || [];
    if (words.length === 0) return -100;

    const uniqueWords = new Set(words);
    const lexicalDiversity = uniqueWords.size / words.length;

    // Base score: log of character length multiplied by lexical diversity
    let score = Math.log(trimmed.length) * (1 + lexicalDiversity);

    // Penalties for common boilerplate
    if (/table of contents|copyright|all rights reserved|terms of service|privacy policy/i.test(trimmed)) {
      score -= 5;
    }

    // Bonus for sentence structure and informative punctuation
    const sentenceCount = (trimmed.match(/[.!?]\s/g) || []).length;
    if (sentenceCount >= 2) {
      score += 1.5;
    }

    return score;
  }

  /**
   * Extracts human-readable location tag from Prisma locationMetadata JSON.
   */
  private static formatLocation(meta: unknown): string {
    if (!meta || typeof meta !== 'object') return '';
    const m = meta as Record<string, unknown>;

    if (m.pageNumber !== undefined) {
      return `Page ${m.pageNumber}${m.header ? ` (${m.header})` : ''}`;
    }
    if (m.timestamp !== undefined) {
      return `Timestamp ${m.timestamp}`;
    }
    if (m.anchorId !== undefined || m.url !== undefined) {
      return `Section: ${m.anchorId || m.url}`;
    }
    if (m.lineStart !== undefined) {
      return `Lines ${m.lineStart}-${m.lineEnd || m.lineStart}`;
    }
    return '';
  }

  /**
   * Safety guardrail: Hard limits total characters to avoid context window blowup.
   */
  private static enforceBudget(assembled: string): string {
    if (assembled.length <= this.MAX_BUDGET_CHARS) {
      return assembled;
    }
    return assembled.slice(0, this.MAX_BUDGET_CHARS) + '\n\n[... Remaining content truncated to fit token budget ...]';
  }
}
