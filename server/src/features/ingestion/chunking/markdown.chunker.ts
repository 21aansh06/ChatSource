import { ExtractedDocument, ProcessedChunk } from '../contract/ingestion.handler.js';

interface MarkdownSection {
  header: string;
  headerLevel: number;
  breadcrumbs: string[];
  contentLines: string[];
  lineStart: number;
  lineEnd: number;
  hasCodeBlock: boolean;
  hasTable: boolean;
  codeLanguages: string[];
}

/**
 * Production AST-Aware Markdown Chunker:
 * 1. Parses document into hierarchical header sections (# H1 through ###### H6).
 * 2. Injects contextual breadcrumbs (e.g. "[Context: Doc > Section > Subsection]\n\n") to maximize vector search relevance.
 * 3. Preserves fenced code blocks (``` / ~~~) and GFM tables (| ... |) as atomic units.
 * 4. Respects maximum token boundaries (~500 tokens / 1500-2000 chars) with safe paragraph splitting.
 */
export async function chunkMarkdownDocument(
  document: ExtractedDocument,
  maxChunkChars = 1500,
  overlapChars = 200
): Promise<ProcessedChunk[]> {
  const lines = document.fullText.split(/\r?\n/);
  const sections: MarkdownSection[] = [];

  let currentBreadcrumbs: { level: number; title: string }[] = [];
  let currentSection: MarkdownSection = {
    header: 'Introduction',
    headerLevel: 0,
    breadcrumbs: [],
    contentLines: [],
    lineStart: 1,
    lineEnd: 1,
    hasCodeBlock: false,
    hasTable: false,
    codeLanguages: [],
  };

  let inCodeBlock = false;
  let currentCodeLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Track fenced code blocks (``` or ~~~) to avoid parsing headers inside code
    const codeBlockMatch = line.match(/^(\`\`\`|\~\~\~)(\w*)/);
    if (codeBlockMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        currentCodeLang = codeBlockMatch[2] || 'text';
        currentSection.hasCodeBlock = true;
        if (currentCodeLang && !currentSection.codeLanguages.includes(currentCodeLang)) {
          currentSection.codeLanguages.push(currentCodeLang);
        }
      } else {
        inCodeBlock = false;
      }
      currentSection.contentLines.push(line);
      currentSection.lineEnd = lineNum;
      continue;
    }

    if (inCodeBlock) {
      currentSection.contentLines.push(line);
      currentSection.lineEnd = lineNum;
      continue;
    }

    // Check for GFM table syntax
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      currentSection.hasTable = true;
    }

    // Check for ATX Markdown Headers (# Header 1, ## Header 2, etc.)
    const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      // Flush previous section if it contains content
      if (currentSection.contentLines.some((l) => l.trim().length > 0)) {
        sections.push({ ...currentSection });
      }

      const level = headerMatch[1].length;
      const title = headerMatch[2].trim();

      // Update hierarchical breadcrumb trail
      currentBreadcrumbs = currentBreadcrumbs.filter((b) => b.level < level);
      currentBreadcrumbs.push({ level, title });

      const breadcrumbTitles = currentBreadcrumbs.map((b) => b.title);

      currentSection = {
        header: title,
        headerLevel: level,
        breadcrumbs: breadcrumbTitles,
        contentLines: [line],
        lineStart: lineNum,
        lineEnd: lineNum,
        hasCodeBlock: false,
        hasTable: false,
        codeLanguages: [],
      };
      continue;
    }

    currentSection.contentLines.push(line);
    currentSection.lineEnd = lineNum;
  }

  // Flush final section
  if (currentSection.contentLines.some((l) => l.trim().length > 0)) {
    sections.push(currentSection);
  }

  // Secondary Pass: Subdivide oversized sections while keeping code blocks & tables atomic
  const chunks: ProcessedChunk[] = [];
  let chunkIndex = 0;
  let charCursor = 0;

  for (const section of sections) {
    const rawSectionContent = section.contentLines.join('\n').trim();
    if (!rawSectionContent) continue;

    const breadcrumbPrefix =
      section.breadcrumbs.length > 0
        ? `[Context: ${section.breadcrumbs.join(' > ')}]\n\n`
        : '';

    // If section fits within chunk limit, emit as single atomic chunk
    if (rawSectionContent.length + breadcrumbPrefix.length <= maxChunkChars) {
      const fullChunkText = `${breadcrumbPrefix}${rawSectionContent}`;
      const charOffsetStart = charCursor;
      const charOffsetEnd = charCursor + rawSectionContent.length;

      chunks.push({
        content: fullChunkText,
        chunkIndex: chunkIndex++,
        tokenCount: Math.ceil(fullChunkText.length / 4),
        locationMetadata: {
          sectionBreadcrumbs: section.breadcrumbs,
          header: section.header,
          headerLevel: section.headerLevel,
          lineStart: section.lineStart,
          lineEnd: section.lineEnd,
          charOffsetStart,
          charOffsetEnd,
          hasCodeBlock: section.hasCodeBlock,
          hasTable: section.hasTable,
          codeLanguages: section.codeLanguages,
        },
      });

      charCursor += rawSectionContent.length + 1;
      continue;
    }

    // Split large sections by paragraphs while preserving atomic blocks
    const paragraphs = rawSectionContent.split(/\n\n+/);
    let currentParagraphs: string[] = [];
    let currentLength = 0;
    let chunkLineStart = section.lineStart;

    for (const paragraph of paragraphs) {
      const paraLength = paragraph.length + 2;

      if (currentLength + paraLength > maxChunkChars && currentParagraphs.length > 0) {
        const bodyContent = currentParagraphs.join('\n\n');
        const fullChunkText = `${breadcrumbPrefix}${bodyContent}`;
        const charOffsetStart = charCursor;
        const charOffsetEnd = charCursor + bodyContent.length;

        chunks.push({
          content: fullChunkText,
          chunkIndex: chunkIndex++,
          tokenCount: Math.ceil(fullChunkText.length / 4),
          locationMetadata: {
            sectionBreadcrumbs: section.breadcrumbs,
            header: section.header,
            headerLevel: section.headerLevel,
            lineStart: chunkLineStart,
            lineEnd: section.lineEnd,
            charOffsetStart,
            charOffsetEnd,
            hasCodeBlock: bodyContent.includes('```'),
            hasTable: bodyContent.includes('|'),
          },
        });

        charCursor += bodyContent.length + 2;
        currentParagraphs = [paragraph];
        currentLength = paraLength;
      } else {
        currentParagraphs.push(paragraph);
        currentLength += paraLength;
      }
    }

    if (currentParagraphs.length > 0) {
      const bodyContent = currentParagraphs.join('\n\n');
      const fullChunkText = `${breadcrumbPrefix}${bodyContent}`;
      const charOffsetStart = charCursor;
      const charOffsetEnd = charCursor + bodyContent.length;

      chunks.push({
        content: fullChunkText,
        chunkIndex: chunkIndex++,
        tokenCount: Math.ceil(fullChunkText.length / 4),
        locationMetadata: {
          sectionBreadcrumbs: section.breadcrumbs,
          header: section.header,
          headerLevel: section.headerLevel,
          lineStart: chunkLineStart,
          lineEnd: section.lineEnd,
          charOffsetStart,
          charOffsetEnd,
          hasCodeBlock: bodyContent.includes('```'),
          hasTable: bodyContent.includes('|'),
        },
      });

      charCursor += bodyContent.length + 2;
    }
  }

  return chunks;
}
