import { StorageProvider } from "./providers/storage.provider.js";

export class StorageService {

  private static provider: StorageProvider;

  static setProvider(provider: StorageProvider) {
    this.provider = provider;

    console.log(
      `[Storage] Provider switched to "${provider.name}".`
    );
  }

  static upload(key: string, file: any) {
    return this.provider.upload(key, file);
  }

  static download(key: string) {
    return this.provider.download(key);
  }

  static delete(key: string) {
    return this.provider.delete(key);
  }

}