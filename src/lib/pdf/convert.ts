import * as pdfjs from 'pdfjs-dist';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

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
  for (let i = 0; i < images.length; i++) {
    const filename = `${baseFilename}_page_${i + 1}.${format}`;
    downloadImage(images[i], filename);
    // Small delay between downloads
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
