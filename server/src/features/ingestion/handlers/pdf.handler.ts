import { Source, SourceType } from '@prisma/client';
import pdfParse from 'pdf-parse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { createCanvas } from '@napi-rs/canvas';
import { createWorker } from 'tesseract.js';
import { IngestionHandler, ExtractedDocument, ProcessedChunk, ExtractedPage } from '../contract/ingestion.handler.js';
import { chunkPDFDocument } from '../chunking/pdf.chunker.js';
import { StorageService } from '../../storage/storage.service.js';

/**
 * NodeCanvasFactory implementation for pdfjs-dist in Node.js environment.
 * Uses @napi-rs/canvas for high-performance, cross-platform PDF page rendering.
 */
class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(Math.max(1, width), Math.max(1, height));
    const context = canvas.getContext('2d');
    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext: any, width: number, height: number) {
    canvasAndContext.canvas.width = Math.max(1, width);
    canvasAndContext.canvas.height = Math.max(1, height);
  }

  destroy(canvasAndContext: any) {
    if (canvasAndContext.canvas) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
      canvasAndContext.canvas = null;
      canvasAndContext.context = null;
    }
  }
}

export class PDFIngestionHandler implements IngestionHandler {
  readonly sourceType = SourceType.PDF;

  /**
   * Decision Tree PDF Parsing Pipeline:
   * 1. Digital PDF extraction via pdf-parse.
   * 2. Page text density classification.
   * 3. OCR fallback: Uses pdfjs-dist + @napi-rs/canvas to rasterize each page to a PNG buffer,
   *    then passes the PNG image buffer to Tesseract.js for page-by-page OCR recognition.
   * 4. Loud failure if OCR density remains below readable threshold (< 20 chars/page).
   */
  async extractContent(source: Source): Promise<ExtractedDocument> {
    if (!source.fileKey && !source.rawText) {
      throw new Error(`[PDFIngestionHandler] Missing file key or buffer for PDF source ${source.id}`);
    }

    let pdfBuffer: Buffer;
    if (source.fileKey) {
      console.log(`[PDFIngestionHandler] Downloading PDF file from storage key: ${source.fileKey}`);
      pdfBuffer = await StorageService.download(source.fileKey);
    } else if (source.rawText) {
      pdfBuffer = Buffer.from(source.rawText, 'base64');
    } else {
      throw new Error(`[PDFIngestionHandler] No valid file key or raw text found for source ${source.id}`);
    }

    let parsedData: pdfParse.Result;
    try {
      parsedData = await pdfParse(pdfBuffer);
    } catch (err: any) {
      throw new Error(`[PDFIngestionHandler] Digital PDF extraction failed: ${err?.message || err}`);
    }

    const pageCount = parsedData.numpages || 1;
    const rawFullText = parsedData.text || '';
    const avgDensity = rawFullText.trim().length / pageCount;

    console.log(`[PDFIngestionHandler] Extracted PDF page count: ${pageCount}, avg text density: ${avgDensity.toFixed(1)} chars/page`);

    let pages: ExtractedPage[] = [];
    let finalFullText = rawFullText;

    // Decision Tree Step: If text density < 50 chars/page, document is a scanned image PDF -> Fallback to OCR
    if (avgDensity < 50) {
      console.warn(`[PDFIngestionHandler] Low text density detected (${avgDensity.toFixed(1)} chars/page). Routing to Page-by-Page OCR Fallback Pipeline...`);

      let ocrPages: ExtractedPage[] = [];
      let totalOcrChars = 0;

      try {
        // 1. Rasterize PDF pages using pdfjs-dist + canvas
        const canvasFactory = new NodeCanvasFactory();
        const loadingTask = pdfjsLib.getDocument({
          data: new Uint8Array(pdfBuffer),
          canvasFactory: canvasFactory as any,
          disableFontFace: true,
        });

        const pdfDoc = await loadingTask.promise;
        const ocrWorker = await createWorker('eng');

        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 2.0 }); // 2x scale factor for high-resolution OCR rendering

          const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);
          
          await page.render({
            canvasContext: canvasAndContext.context as any,
            viewport,
          }).promise;

          // Convert page canvas to PNG buffer suitable for Tesseract.js recognize()
          const imageBuffer = canvasAndContext.canvas.toBuffer('image/png');
          canvasFactory.destroy(canvasAndContext);

          // 2. Perform OCR recognition on the page image buffer
          const ocrResult = await ocrWorker.recognize(imageBuffer);
          const pageText = ocrResult.data.text ? ocrResult.data.text.trim() : '';

          totalOcrChars += pageText.length;
          ocrPages.push({
            pageNumber: i,
            text: pageText,
          });

          console.log(`[PDFIngestionHandler] Page ${i}/${pdfDoc.numPages} OCR completed (${pageText.length} chars).`);
        }

        await ocrWorker.terminate();

        const ocrDensity = totalOcrChars / pageCount;

        if (ocrDensity < 20) {
          throw new Error('Unparseable PDF: text density below readable threshold (low quality scan or empty file)');
        }

        finalFullText = ocrPages.map((p) => p.text).join('\n\n');
        pages = ocrPages;
        console.log(`[PDFIngestionHandler] OCR Fallback completed successfully across ${pageCount} pages with overall density: ${ocrDensity.toFixed(1)} chars/page`);
      } catch (ocrErr: any) {
        if (ocrErr?.message?.includes('Unparseable PDF')) {
          throw ocrErr;
        }
        throw new Error(`[PDFIngestionHandler] OCR Fallback failed: ${ocrErr?.message || ocrErr}`);
      }
    } else {
      // Digital PDF
      const pageTexts = rawFullText.split(/\f|\n--- Page \d+ ---\n/);
      if (pageTexts.length > 1) {
        pages = pageTexts.map((text, idx) => ({ pageNumber: idx + 1, text }));
      } else {
        pages = [{ pageNumber: 1, text: rawFullText }];
      }
    }

    return {
      sourceId: source.id,
      notebookId: source.notebookId,
      userId: source.userId,
      title: source.title,
      sourceType: SourceType.PDF,
      pages,
      fullText: finalFullText,
      sourceMetadata: {
        pageCount,
        fileKey: source.fileKey,
      },
    };
  }

  async chunkDocument(document: ExtractedDocument): Promise<ProcessedChunk[]> {
    return chunkPDFDocument(document);
  }
}
