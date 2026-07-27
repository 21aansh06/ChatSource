import { createWorker, Worker } from 'tesseract.js';

/**
 * Provider contract for Optical Character Recognition (OCR).
 * Abstraction allows running a single worker, a worker pool, or external cloud OCR APIs
 * without modifying PDF ingestion logic.
 */
export interface OCRProvider {
  readonly name: string;
  recognizeImage(imageBuffer: Buffer): Promise<string>;
  dispose(): Promise<void>;
}

/**
 * Low-Resource Tesseract Provider for Render 512MB RAM / 0.1 vCPU environments.
 * Creates exactly ONE Tesseract worker lazily on first page request, reuses it for all pages
 * of a document, and terminates it when disposal is requested.
 */
export class SingleWorkerTesseractProvider implements OCRProvider {
  readonly name = 'tesseract-single-worker';
  private worker: Worker | null = null;
  private lang: string;

  constructor(lang = 'eng') {
    this.lang = lang;
  }

  private async getWorker(): Promise<Worker> {
    if (!this.worker) {
      this.worker = await createWorker(this.lang);
    }
    return this.worker;
  }

  async recognizeImage(imageBuffer: Buffer): Promise<string> {
    const worker = await this.getWorker();
    const result = await worker.recognize(imageBuffer);
    return result.data.text ? result.data.text.trim() : '';
  }

  async dispose(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
}
