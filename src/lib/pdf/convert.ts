import * as pdfjs from 'pdfjs-dist';
import JSZip from 'jszip';

// Set worker source - use unpkg as fallback CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export interface ConvertOptions {
  format: 'png' | 'jpeg';
  quality: number; // 0-1 for jpeg
  scale: number; // 1 = 100%, 2 = 200%
}

export async function pdfToImages(
  pdfFile: File,
  options: ConvertOptions = { format: 'png', quality: 0.9, scale: 2 }
): Promise<string[]> {
  const arrayBuffer = await pdfFile.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: options.scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const mimeType = options.format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType, options.quality);
    images.push(dataUrl);
  }

  return images;
}

export function downloadImage(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadAllImages(
  images: string[],
  baseFilename: string,
  format: 'png' | 'jpeg'
): Promise<void> {
  // For single image, download directly
  if (images.length === 1) {
    const filename = `${baseFilename}.${format}`;
    downloadImage(images[0], filename);
    return;
  }

  // For multiple images, create a ZIP file
  const zip = new JSZip();

  for (let i = 0; i < images.length; i++) {
    const filename = `${baseFilename}_page_${i + 1}.${format}`;
    // Convert data URL to blob
    const response = await fetch(images[i]);
    const blob = await response.blob();
    zip.file(filename, blob);
  }

  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const zipUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = `${baseFilename}_images.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(zipUrl);
}
