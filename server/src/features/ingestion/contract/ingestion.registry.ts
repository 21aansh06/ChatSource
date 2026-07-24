import { SourceType } from '@prisma/client';
import { IngestionHandler } from './ingestion.handler.js';

export class IngestionRegistry {
  private static handlers = new Map<SourceType | string, IngestionHandler>();

  /**
   * Register a new source handler instance
   */
  static register(handler: IngestionHandler): void {
    if (this.handlers.has(handler.sourceType)) {
      console.warn(`[IngestionRegistry] Overwriting registered handler for source type: ${handler.sourceType}`);
    }
    this.handlers.set(handler.sourceType, handler);
    console.log(`[IngestionRegistry] Registered handler for source type: ${handler.sourceType}`);
  }

  /**
   * Lookup handler by source type. Throws actionable error if unhandled.
   */
  static getHandler(sourceType: SourceType | string): IngestionHandler {
    const handler = this.handlers.get(sourceType);
    if (!handler) {
      throw new Error(
        `[IngestionRegistry] No ingestion handler registered for source type "${sourceType}". ` +
          `Make sure to register the handler implementation in IngestionRegistry.`
      );
    }
    return handler;
  }

  /**
   * List all registered source types
   */
  static getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
