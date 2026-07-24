import { UploadFile } from "../storage.schema";

export interface StorageProvider {
  readonly name: string;

  upload(
    key: string,
    file: UploadFile
  ): Promise<string>;

  download(
    key: string
  ): Promise<Buffer>;

  delete(
    key: string
  ): Promise<void>;
}