import { PDFDocument } from 'pdf-lib';

export interface SplitOptions {
  pageRanges: string; // e.g., "1-3, 5, 7-9"
}

export async function splitPdf(
  pdfFile: File,
  options: SplitOptions
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const originalPdf = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();

  const pageIndices = parsePageRanges(options.pageRanges, originalPdf.getPageCount());

  const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));

  return newPdf.save();
}

export async function extractAllPages(pdfFile: File): Promise<Uint8Array[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const originalPdf = await PDFDocument.load(arrayBuffer);
  const pageCount = originalPdf.getPageCount();
  const results: Uint8Array[] = [];

  for (let i = 0; i < pageCount; i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(originalPdf, [i]);
    newPdf.addPage(copiedPage);
    results.push(await newPdf.save());
  }

  return results;
}

function parsePageRanges(rangeStr: string, maxPages: number): number[] {
  const indices: number[] = [];
  const parts = rangeStr.split(',').map((s) => s.trim());

  for (const part of parts) {
    if (part.includes('-')) {
      const [start, end] = part.split('-').map((n) => parseInt(n.trim(), 10));
      for (let i = start; i <= Math.min(end, maxPages); i++) {
        if (i >= 1 && i <= maxPages) {
          indices.push(i - 1); // Convert to 0-based index
        }
      }
    } else {
      const pageNum = parseInt(part, 10);
      if (pageNum >= 1 && pageNum <= maxPages) {
        indices.push(pageNum - 1);
      }
    }
  }

  return [...new Set(indices)].sort((a, b) => a - b);
}
