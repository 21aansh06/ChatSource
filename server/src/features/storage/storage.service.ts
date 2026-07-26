import { StorageProvider } from "./providers/storage.provider.js";
import { SupabaseStorageProvider } from "./providers/supabase.provider.js";

/**
 * StorageService singleton managing active object storage provider.
 * Uses lazy default initialization (Supabase) to guarantee safe execution across both API and Worker processes.
 */
export class StorageService {
  private static provider: StorageProvider = new SupabaseStorageProvider();

  static setProvider(provider: StorageProvider): void {
    this.provider = provider;
    console.log(`[Storage] Provider switched to "${provider.name}".`);
  }

  private static getProvider(): StorageProvider {
    if (!this.provider) {
      this.provider = new SupabaseStorageProvider();
    }
    return this.provider;
  }

  static upload(key: string, file: any): Promise<string> {
    return this.getProvider().upload(key, file);
  }

  static download(key: string): Promise<Buffer> {
    return this.getProvider().download(key);
  }

  static delete(key: string): Promise<void> {
    return this.getProvider().delete(key);
  }
}