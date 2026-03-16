import { PDFDocument } from 'pdf-lib';

export interface CompressionOptions {
  quality: 'low' | 'medium' | 'high';
}

export async function compressPdf(
  pdfFile: File,
  options: CompressionOptions = { quality: 'medium' }
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
  });

  // Remove metadata to reduce size
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');

  // Save with compression options
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: options.quality === 'low' ? 100 : options.quality === 'medium' ? 50 : 20,
  });

  return compressedBytes;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function calculateCompressionRatio(original: number, compressed: number): number {
  return Math.round((1 - compressed / original) * 100);
}
