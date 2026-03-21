import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const WATERMARK_TEXT = 'Made with OriPDF.com';
const WATERMARK_LINK = 'https://oripdf.com';

/**
 * Adds a subtle watermark to all pages of a PDF
 * Used for free tier users
 */
export async function addWatermark(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    // Small text in bottom-right corner
    const fontSize = 8;
    const textWidth = helvetica.widthOfTextAtSize(WATERMARK_TEXT, fontSize);
    const margin = 10;

    // Position: bottom-right
    const x = width - textWidth - margin;
    const y = margin;

    // Draw text with light gray color
    page.drawText(WATERMARK_TEXT, {
      x,
      y,
      size: fontSize,
      font: helvetica,
      color: rgb(0.6, 0.6, 0.6), // Light gray
      opacity: 0.7,
    });

    // Add clickable link annotation
    page.node.set(
      pdfDoc.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [x, y, x + textWidth, y + fontSize],
        Border: [0, 0, 0],
        A: {
          Type: 'Action',
          S: 'URI',
          URI: WATERMARK_LINK,
        },
      })
    );
  }

  return pdfDoc.save();
}

/**
 * Check if watermark should be added based on user plan
 */
export function shouldAddWatermark(isPro: boolean): boolean {
  return !isPro;
}
