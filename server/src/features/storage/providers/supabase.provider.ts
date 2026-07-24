import { supabase } from "../../../infra/supabase.js";
import { env } from "../../../config/env.js";
import { StorageProvider } from "./storage.provider.js";
import { UploadFile } from "../storage.schema.js";

export class SupabaseStorageProvider implements StorageProvider {

  readonly name = "supabase";

  async upload(
    key: string,
    file: UploadFile
  ): Promise<string> {

    const { error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(key, file.buffer, {
        contentType: file.mimeType,
        upsert: false,
      });

    if (error) {
      throw new Error(error.message);
    }

    return key;
  }

  async download(
    key: string
  ): Promise<Buffer> {

    const { data, error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .download(key);

    if (error) {
      throw new Error(error.message);
    }

    return Buffer.from(
      await data.arrayBuffer()
    );
  }

  async delete(
    key: string
  ): Promise<void> {

    const { error } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .remove([key]);

    if (error) {
      throw new Error(error.message);
    }

  }

}