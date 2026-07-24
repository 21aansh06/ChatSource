import { Source, SourceType } from '@prisma/client';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import dns from 'dns/promises';
import { IngestionHandler, ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';
import { chunkWebsiteDocument } from '../chunking/website.chunker.js';

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

    // 2. Fetch raw HTML
    const response = await fetch(safeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ChatSourceIngestionBot/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`[WebsiteIngestionHandler] HTTP ${response.status} ${response.statusText} fetching ${safeUrl}`);
    }

    const html = await response.text();

    // 3. Clean DOM and extract meaningful article content via cheerio
    const $ = cheerio.load(html);

    // Remove noise elements (scripts, styles, navs, footers, ads)
    $('script, style, noscript, nav, footer, header, iframe, svg, [role="navigation"]').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || source.title;
    
    // Extract main text or body text
    const bodyText = $('main, article, #content, .content, body')
      .text()
      .replace(/\s+/g, ' ')
      .trim();

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
