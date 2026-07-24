import { Source, SourceType } from '@prisma/client';
import pdfParse from 'pdf-parse';
import { createWorker } from 'tesseract.js';
import { IngestionHandler, ExtractedDocument, ProcessedChunk, ExtractedPage } from '../contract/ingestion.handler.js';
import { chunkPDFDocument } from '../chunking/pdf.chunker.js';

export class PDFIngestionHandler implements IngestionHandler {
  readonly sourceType = SourceType.PDF;

  /**
   * Decision Tree PDF Parsing Pipeline:
   * 1. Digital PDF extraction via pdf-parse.
   * 2. Page text density classification.
   * 3. OCR fallback using Tesseract.js if page text density is low (scanned document).
   * 4. Loud failure if OCR density is also unreadable.
   */
  async extractContent(source: Source): Promise<ExtractedDocument> {
    if (!source.fileKey && !source.rawText) {
      throw new Error(`[PDFIngestionHandler] Missing file key or buffer for PDF source ${source.id}`);
    }

   
    let pdfBuffer: Buffer;
    if (source.rawText) {
      pdfBuffer = Buffer.from(source.rawText, 'base64');
    } else {
      pdfBuffer = Buffer.from(source.fileKey || '', 'utf-8');
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

    // Decision Tree Step: If text density < 50 chars/page, document is scanned image PDF -> Fallback to OCR
    if (avgDensity < 50) {
      console.warn(`[PDFIngestionHandler] Low text density detected (${avgDensity.toFixed(1)} chars/page). Routing to OCR fallback worker...`);
      
      try {
        const ocrWorker = await createWorker('eng');
        const ret = await ocrWorker.recognize(pdfBuffer);
        await ocrWorker.terminate();

        const ocrText = ret.data.text || '';
        const ocrDensity = ocrText.trim().length / pageCount;

        if (ocrDensity < 20) {
          throw new Error('Unparseable PDF: text density below readable threshold (low quality scan or empty file)');
        }

        finalFullText = ocrText;
        pages = [{ pageNumber: 1, text: ocrText }];
        console.log(`[PDFIngestionHandler] OCR Fallback completed successfully with density: ${ocrDensity.toFixed(1)} chars/page`);
      } catch (ocrErr: any) {
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
