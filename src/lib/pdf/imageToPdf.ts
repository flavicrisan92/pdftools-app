import { PDFDocument, PageSizes } from 'pdf-lib';

export type PageSize = 'a4' | 'letter' | 'fit';
export type Orientation = 'portrait' | 'landscape' | 'auto';
export type Margin = 'none' | 'small' | 'medium';

export interface ImageToPdfOptions {
  pageSize: PageSize;
  orientation: Orientation;
  margin: Margin;
}

const PAGE_SIZES = {
  a4: PageSizes.A4,
  letter: PageSizes.Letter,
};

const MARGINS = {
  none: 0,
  small: 40,
  medium: 72, // 1 inch = 72 points
};

async function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const img = await loadImage(file);
  URL.revokeObjectURL(img.src);
  return { width: img.naturalWidth, height: img.naturalHeight };
}

export async function imagesToPdf(
  images: File[],
  options: ImageToPdfOptions = { pageSize: 'a4', orientation: 'auto', margin: 'small' }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const margin = MARGINS[options.margin];

  for (const imageFile of images) {
    // Get image dimensions
    const dimensions = await getImageDimensions(imageFile);
    const isImageLandscape = dimensions.width > dimensions.height;

    // Determine page dimensions
    let pageWidth: number;
    let pageHeight: number;

    if (options.pageSize === 'fit') {
      // Page fits the image
      pageWidth = dimensions.width + margin * 2;
      pageHeight = dimensions.height + margin * 2;
    } else {
      const baseSize = PAGE_SIZES[options.pageSize];

      // Determine orientation
      let useLandscape: boolean;
      if (options.orientation === 'auto') {
        useLandscape = isImageLandscape;
      } else {
        useLandscape = options.orientation === 'landscape';
      }

      if (useLandscape) {
        pageWidth = Math.max(baseSize[0], baseSize[1]);
        pageHeight = Math.min(baseSize[0], baseSize[1]);
      } else {
        pageWidth = Math.min(baseSize[0], baseSize[1]);
        pageHeight = Math.max(baseSize[0], baseSize[1]);
      }
    }

    // Add page
    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Calculate image placement
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    // Scale image to fit while maintaining aspect ratio
    const scaleX = availableWidth / dimensions.width;
    const scaleY = availableHeight / dimensions.height;
    const scale = Math.min(scaleX, scaleY); // Scale to fit page

    const scaledWidth = dimensions.width * scale;
    const scaledHeight = dimensions.height * scale;

    // Center the image
    const x = margin + (availableWidth - scaledWidth) / 2;
    const y = margin + (availableHeight - scaledHeight) / 2;

    // Embed image
    const imageBytes = await imageFile.arrayBuffer();
    let embeddedImage;

    if (imageFile.type === 'image/png') {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    } else if (imageFile.type === 'image/jpeg' || imageFile.type === 'image/jpg') {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else {
      // For other formats (like WebP), convert to PNG via canvas
      const img = await loadImage(imageFile);
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);

      const pngDataUrl = canvas.toDataURL('image/png');
      const pngData = await fetch(pngDataUrl).then((r) => r.arrayBuffer());
      embeddedImage = await pdfDoc.embedPng(pngData);
    }

    // Draw image on page
    page.drawImage(embeddedImage, {
      x,
      y,
      width: scaledWidth,
      height: scaledHeight,
    });
  }

  return pdfDoc.save();
}

export function downloadPdf(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
