import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';

export type SupportedFileType = 'pdf' | 'image' | 'docx' | 'unknown';

/**
 * Detect the type of file based on extension and MIME type
 */
export function detectFileType(file: File): SupportedFileType {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const mimeType = file.type.toLowerCase();

  // PDF
  if (extension === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }

  // Images
  if (
    mimeType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(extension || '')
  ) {
    return 'image';
  }

  // DOCX
  if (
    extension === 'docx' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return 'docx';
  }

  // DOC (old Word format) - we'll try to handle it but may not work well
  if (extension === 'doc' || mimeType === 'application/msword') {
    return 'docx'; // Try to process as docx
  }

  return 'unknown';
}

/**
 * Convert an image file to PDF
 */
export async function imageToPdf(file: File): Promise<File> {
  const pdfDoc = await PDFDocument.create();

  const imageBytes = await file.arrayBuffer();
  const mimeType = file.type.toLowerCase();

  let image;
  if (mimeType === 'image/png') {
    image = await pdfDoc.embedPng(imageBytes);
  } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    image = await pdfDoc.embedJpg(imageBytes);
  } else {
    // For other formats, convert to PNG first using canvas
    const dataUrl = await fileToDataUrl(file);
    const pngDataUrl = await convertImageToPng(dataUrl);
    const pngBytes = await dataUrlToArrayBuffer(pngDataUrl);
    image = await pdfDoc.embedPng(pngBytes);
  }

  // Create a page with the same aspect ratio as the image
  const { width, height } = image.scale(1);

  // Max page size (A4 at 72 DPI is about 595x842)
  const maxWidth = 595;
  const maxHeight = 842;

  let pageWidth = width;
  let pageHeight = height;

  // Scale down if larger than A4
  if (width > maxWidth || height > maxHeight) {
    const scale = Math.min(maxWidth / width, maxHeight / height);
    pageWidth = width * scale;
    pageHeight = height * scale;
  }

  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(image, {
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
  });

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return new File([pdfBlob], `${baseName}.pdf`, { type: 'application/pdf' });
}

/**
 * Convert DOCX to PDF
 */
export async function docxToPdf(file: File): Promise<File> {
  const arrayBuffer = await file.arrayBuffer();

  // Convert DOCX to HTML using mammoth
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Create PDF from HTML content
  const pdfDoc = await PDFDocument.create();

  // Simple approach: render HTML to canvas, then to PDF
  // For better results, we'd need a proper HTML-to-PDF library
  const page = pdfDoc.addPage([595, 842]); // A4 size

  // Extract text from HTML (basic approach)
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const textContent = tempDiv.textContent || tempDiv.innerText || '';

  // Draw text on PDF (very basic - just shows the text content)
  const fontSize = 11;
  const lineHeight = fontSize * 1.4;
  const margin = 50;
  const maxWidth = 595 - margin * 2;

  // Split text into lines
  const words = textContent.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // Approximate character width
    if (testLine.length * (fontSize * 0.5) > maxWidth) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Draw lines
  let y = 842 - margin;
  let currentPage = page;

  for (const line of lines) {
    if (y < margin) {
      // Add new page
      currentPage = pdfDoc.addPage([595, 842]);
      y = 842 - margin;
    }

    currentPage.drawText(line, {
      x: margin,
      y,
      size: fontSize,
    });

    y -= lineHeight;
  }

  const pdfBytes = await pdfDoc.save();
  const pdfBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

  const baseName = file.name.replace(/\.[^/.]+$/, '');
  return new File([pdfBlob], `${baseName}.pdf`, { type: 'application/pdf' });
}

/**
 * Convert any supported document to PDF
 */
export async function convertToPdf(file: File): Promise<File> {
  const fileType = detectFileType(file);

  switch (fileType) {
    case 'pdf':
      return file; // Already PDF
    case 'image':
      return imageToPdf(file);
    case 'docx':
      return docxToPdf(file);
    default:
      throw new Error(`Unsupported file type: ${file.type || file.name}`);
  }
}

/**
 * Get accepted file types for the dropzone
 */
export function getAcceptedFileTypes(): Record<string, string[]> {
  return {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/msword': ['.doc'],
  };
}

/**
 * Get accepted extensions as a string for display
 */
export function getAcceptedExtensions(): string {
  return 'PDF, PNG, JPG, DOCX';
}

// Helper functions
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function convertImageToPng(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

function dataUrlToArrayBuffer(dataUrl: string): Promise<ArrayBuffer> {
  return fetch(dataUrl).then(res => res.arrayBuffer());
}
