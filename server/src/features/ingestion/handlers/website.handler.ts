import { Source, SourceType } from '@prisma/client';
import { URL } from 'url';
import dns from 'dns/promises';
import { IngestionHandler, ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';
import { chunkWebsiteDocument } from '../chunking/website.chunker.js';
import { getFirecrawlClient } from '../../../infra/firecrawl.js';

export class WebsiteIngestionHandler implements IngestionHandler {
  readonly sourceType = SourceType.WEBSITE;

  /**
   * SSRF Defense Validator: Resolves hostname IP and blocks internal/private network access attempts.
   */
  private async validateUrlForSSRF(targetUrl: string): Promise<string> {
    let parsed: URL;
    try {
      parsed = new URL(targetUrl);
    } catch {
      throw new Error(`[WebsiteIngestionHandler] Invalid URL format: ${targetUrl}`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`[WebsiteIngestionHandler] Forbidden protocol: ${parsed.protocol}. Only http and https are allowed.`);
    }

    const hostname = parsed.hostname.toLowerCase();

    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname === 'metadata.google.internal') {
      throw new Error(`[SSRF Defense] Access to local/internal hostname "${hostname}" is forbidden.`);
    }

    // Resolve IP address
    let addresses: string[] = [];
    try {
      const resolved = await dns.lookup(hostname, { all: true });
      addresses = resolved.map((r) => r.address);
    } catch {
      throw new Error(`[WebsiteIngestionHandler] Failed to resolve hostname: ${hostname}`);
    }

    for (const ip of addresses) {
      if (
        ip.startsWith('127.') || // Loopback
        ip.startsWith('10.') || // Class A Private
        ip.startsWith('192.168.') || // Class C Private
        ip === '169.254.169.254' || // AWS/Cloud Instance Metadata Service
        ip.startsWith('172.16.') || ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
        ip.startsWith('172.20.') || ip.startsWith('172.21.') || ip.startsWith('172.22.') || ip.startsWith('172.23.') ||
        ip.startsWith('172.24.') || ip.startsWith('172.25.') || ip.startsWith('172.26.') || ip.startsWith('172.27.') ||
        ip.startsWith('172.28.') || ip.startsWith('172.29.') || ip.startsWith('172.30.') || ip.startsWith('172.31.') ||
        ip === '::1' || ip === '0.0.0.0'
      ) {
        throw new Error(`[SSRF Defense] Resolved IP address ${ip} for target ${hostname} is inside a private/internal network boundary.`);
      }
    }

    return parsed.toString();
  }

  async extractContent(source: Source): Promise<ExtractedDocument> {
    if (!source.url) {
      throw new Error(`[WebsiteIngestionHandler] Source ${source.id} is missing target URL`);
    }

    // 1. SSRF Security check
    const safeUrl = await this.validateUrlForSSRF(source.url);

    // 2. Obtain singleton Firecrawl client (validates API key & reuses HTTP connection pool)
    const firecrawl = getFirecrawlClient();

    // 3. Scrape via Firecrawl SDK
    let title = source.title;
    let bodyText = '';

    try {
      console.log(`[WebsiteIngestionHandler] Scraping website ${safeUrl} via Firecrawl singleton client...`);
      const scrapeResult = await firecrawl.scrape(safeUrl, {
        formats: ['markdown'],
      });

      if (scrapeResult?.markdown && scrapeResult.markdown.trim().length >= 50) {
        bodyText = scrapeResult.markdown.trim();
      }

      const metaTitle = scrapeResult?.metadata?.title || scrapeResult?.metadata?.ogTitle;
      if (metaTitle && typeof metaTitle === 'string' && metaTitle.trim()) {
        title = metaTitle.trim();
      }
    } catch (firecrawlErr: any) {
      throw new Error(`[WebsiteIngestionHandler] Firecrawl scrape failed for ${safeUrl}: ${firecrawlErr?.message || firecrawlErr}`);
    }

    if (!bodyText || bodyText.length < 50) {
      throw new Error(`[WebsiteIngestionHandler] Extracted webpage text content is empty or near-empty from ${safeUrl}`);
    }

    return {
      sourceId: source.id,
      notebookId: source.notebookId,
      userId: source.userId,
      title,
      sourceType: SourceType.WEBSITE,
      pages: [{ pageNumber: 1, text: bodyText }],
      fullText: bodyText,
      sourceMetadata: {
        url: safeUrl,
        extractedTitle: title,
      },
    };
  }

  async chunkDocument(document: ExtractedDocument): Promise<ProcessedChunk[]> {
    return chunkWebsiteDocument(document);
  }
}



