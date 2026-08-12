import Firecrawl from 'firecrawl';
import { env } from '../config/env.js';

/**
 * Singleton Firecrawl SDK client instance.
 * Avoids instantiating new clients per request to preserve connection pools and resources.
 */
let firecrawlClientInstance: Firecrawl | null = null;

export function getFirecrawlClient(): Firecrawl {
  const apiKey = env.FIRECRAWL_API_KEY;
  
  if (!apiKey) {
    throw new Error('[FirecrawlClient] FIRECRAWL_API_KEY is missing. Website scraping requires a valid Firecrawl API key.');
  }

  if (!firecrawlClientInstance) {
    firecrawlClientInstance = new Firecrawl({ apiKey });
  }

  return firecrawlClientInstance;
}
