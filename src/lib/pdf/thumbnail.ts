import * as pdfjs from 'pdfjs-dist';

// Reuse worker source from convert.ts
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Generate a thumbnail for a specific page of a PDF
 */
export async function generateThumbnail(
  file: File,
  pageNumber: number = 1,
  maxWidth: number = 150
): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdf.numPages} pages.`);
  }

  const page = await pdf.getPage(pageNumber);
  const originalViewport = page.getViewport({ scale: 1 });

  // Calculate scale to fit maxWidth
  const scale = maxWidth / originalViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  }).promise;

  return canvas.toDataURL('image/png');
}

/**
 * Generate thumbnails for all pages of a PDF
 */
export async function generateAllThumbnails(
  file: File,
  maxWidth: number = 150
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const thumbnails: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const originalViewport = page.getViewport({ scale: 1 });
    const scale = maxWidth / originalViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    thumbnails.push(canvas.toDataURL('image/png'));
  }

  return thumbnails;
}

/**
 * Get the number of pages in a PDF
 */
export async function getPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  return pdf.numPages;
}
