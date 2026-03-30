import { PDFDocument } from 'pdf-lib';

export interface SignaturePosition {
  x: number; // percentage 0-100 from left
  y: number; // percentage 0-100 from top
}

export interface SignatureSize {
  width: number; // percentage of page width
  height: number; // percentage of page height
}

export interface AddSignatureOptions {
  signatureImage: string; // data URL (PNG with transparency)
  pages: number[]; // 1-indexed page numbers
  positions: Record<number, SignaturePosition>; // per-page positions
  sizes: Record<number, SignatureSize>; // per-page sizes
  defaultPosition: SignaturePosition;
  defaultSize: SignatureSize;
}

/**
 * Converts a data URL to Uint8Array
 */
async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

/**
 * Gets the dimensions of an image from a data URL
 */
async function getImageDimensions(
  dataUrl: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/**
 * Adds a signature image to specific pages of a PDF
 */
export async function addSignatureToPdf(
  pdfFile: File,
  options: AddSignatureOptions
): Promise<Uint8Array> {
  const { signatureImage, pages, positions, sizes, defaultPosition, defaultSize } = options;

  // Load the PDF
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  // Convert signature to bytes
  const signatureBytes = await dataUrlToUint8Array(signatureImage);

  // Embed the signature image (PNG)
  const embeddedImage = await pdfDoc.embedPng(signatureBytes);

  // Get image aspect ratio
  const imgDims = await getImageDimensions(signatureImage);
  const aspectRatio = imgDims.width / imgDims.height;

  // Get all pages
  const allPages = pdfDoc.getPages();

  // Add signature to specified pages
  for (const pageNum of pages) {
    const pageIndex = pageNum - 1; // Convert to 0-indexed
    if (pageIndex < 0 || pageIndex >= allPages.length) continue;

    // Get per-page position and size, or use defaults
    const position = positions[pageNum] || defaultPosition;
    const size = sizes[pageNum] || defaultSize;

    const page = allPages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Calculate signature dimensions in points
    let sigWidth = (size.width / 100) * pageWidth;
    let sigHeight = sigWidth / aspectRatio;

    // If height exceeds the specified size, constrain by height
    const maxHeight = (size.height / 100) * pageHeight;
    if (sigHeight > maxHeight) {
      sigHeight = maxHeight;
      sigWidth = sigHeight * aspectRatio;
    }

    // Calculate position (PDF coordinates are from bottom-left)
    const x = (position.x / 100) * pageWidth;
    const y = pageHeight - (position.y / 100) * pageHeight - sigHeight;

    // Draw the signature
    page.drawImage(embeddedImage, {
      x,
      y,
      width: sigWidth,
      height: sigHeight,
    });
  }

  return pdfDoc.save();
}

/**
 * Adds multiple signatures to a PDF
 */
export async function addSignaturesToPdf(
  pdfFile: File,
  signaturesOptions: AddSignatureOptions[]
): Promise<Uint8Array> {
  // Load the PDF
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const allPages = pdfDoc.getPages();

  // Process each signature
  for (const options of signaturesOptions) {
    const { signatureImage, pages, positions, sizes, defaultPosition, defaultSize } = options;

    // Convert signature to bytes
    const signatureBytes = await dataUrlToUint8Array(signatureImage);

    // Embed the signature image (PNG)
    const embeddedImage = await pdfDoc.embedPng(signatureBytes);

    // Get image aspect ratio
    const imgDims = await getImageDimensions(signatureImage);
    const aspectRatio = imgDims.width / imgDims.height;

    // Find first page size if set (for auto-apply to other pages)
    const firstPageWithSize = pages.find(p => sizes[p]);
    const inheritedSize = firstPageWithSize ? sizes[firstPageWithSize] : null;

    // Add signature to specified pages
    for (const pageNum of pages) {
      const pageIndex = pageNum - 1;
      if (pageIndex < 0 || pageIndex >= allPages.length) continue;

      // Get per-page position, or use default
      const position = positions[pageNum] || defaultPosition;
      // Get per-page size, or use inherited size from first page, or use default
      const size = sizes[pageNum] || inheritedSize || defaultSize;

      const page = allPages[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Calculate signature dimensions in points
      let sigWidth = (size.width / 100) * pageWidth;
      let sigHeight = sigWidth / aspectRatio;

      // If height exceeds the specified size, constrain by height
      const maxHeight = (size.height / 100) * pageHeight;
      if (sigHeight > maxHeight) {
        sigHeight = maxHeight;
        sigWidth = sigHeight * aspectRatio;
      }

      // Calculate position (PDF coordinates are from bottom-left)
      const x = (position.x / 100) * pageWidth;
      const y = pageHeight - (position.y / 100) * pageHeight - sigHeight;

      // Draw the signature
      page.drawImage(embeddedImage, {
        x,
        y,
        width: sigWidth,
        height: sigHeight,
      });
    }
  }

  return pdfDoc.save();
}

/**
 * Renders a PDF page to a canvas for preview
 */
export async function renderPdfPageToCanvas(
  pdfFile: File,
  pageNumber: number,
  scale = 1
): Promise<HTMLCanvasElement> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not get canvas context');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
  }).promise;

  return canvas;
}

/**
 * Gets the total number of pages in a PDF
 */
export async function getPdfPageCount(pdfFile: File): Promise<number> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  return pdf.numPages;
}
