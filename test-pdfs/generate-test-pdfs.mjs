/**
 * Script pentru generarea PDF-urilor de test
 * Ruleaza cu: node test-pdfs/generate-test-pdfs.mjs
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');

async function createSimplePdf(filename, pageCount, title) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595, 842]); // A4
    const { width, height } = page.getSize();

    // Title
    page.drawText(title, {
      x: 50,
      y: height - 100,
      size: 24,
      font,
      color: rgb(0.2, 0.2, 0.8),
    });

    // Page number
    page.drawText(`Page ${i} of ${pageCount}`, {
      x: 50,
      y: height - 150,
      size: 16,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Content
    page.drawText(`This is sample content for testing PDF tools.`, {
      x: 50,
      y: height - 200,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    page.drawText(`File: ${filename}`, {
      x: 50,
      y: height - 230,
      size: 12,
      font,
      color: rgb(0, 0, 0),
    });

    // Draw a rectangle for visual content
    page.drawRectangle({
      x: 50,
      y: height - 400,
      width: 200,
      height: 100,
      color: rgb(0.9, 0.9, 0.95),
      borderColor: rgb(0.2, 0.2, 0.8),
      borderWidth: 2,
    });
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(path.join(OUTPUT_DIR, filename), pdfBytes);
  console.log(`Created: ${filename} (${pageCount} pages, ${Math.round(pdfBytes.length / 1024)} KB)`);
}

async function createLargePdf(filename, pageCount) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    // Add lots of text to increase file size
    page.drawText(`Page ${i} of ${pageCount}`, {
      x: 50,
      y: height - 50,
      size: 18,
      font,
      color: rgb(0.2, 0.2, 0.8),
    });

    // Add multiple text blocks
    const loremIpsum = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.';

    for (let j = 0; j < 15; j++) {
      page.drawText(loremIpsum.substring(0, 80), {
        x: 50,
        y: height - 100 - (j * 45),
        size: 10,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    }

    // Add some shapes
    for (let k = 0; k < 5; k++) {
      page.drawRectangle({
        x: 50 + k * 100,
        y: 50,
        width: 80,
        height: 40,
        color: rgb(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5),
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(path.join(OUTPUT_DIR, filename), pdfBytes);
  console.log(`Created: ${filename} (${pageCount} pages, ${Math.round(pdfBytes.length / 1024)} KB)`);
}

async function main() {
  console.log('Generating test PDFs...\n');
  console.log(`Output directory: ${OUTPUT_DIR}\n`);

  // === FOR MERGE ===
  console.log('--- For MERGE testing ---');
  await createSimplePdf('merge-doc1.pdf', 2, 'Document 1 - Introduction');
  await createSimplePdf('merge-doc2.pdf', 3, 'Document 2 - Main Content');
  await createSimplePdf('merge-doc3.pdf', 1, 'Document 3 - Conclusion');

  // === FOR SPLIT ===
  console.log('\n--- For SPLIT testing ---');
  await createSimplePdf('split-multipage.pdf', 10, 'Multi-Page Document');
  await createSimplePdf('split-5pages.pdf', 5, 'Five Page Document');

  // === FOR COMPRESS ===
  console.log('\n--- For COMPRESS testing ---');
  await createLargePdf('compress-large.pdf', 20);
  await createLargePdf('compress-medium.pdf', 10);

  // === FOR CONVERT (PDF to Image) ===
  console.log('\n--- For CONVERT testing ---');
  await createSimplePdf('convert-single.pdf', 1, 'Single Page for Conversion');
  await createSimplePdf('convert-multi.pdf', 4, 'Multi-Page for Conversion');

  console.log('\n✓ All test PDFs generated successfully!');
  console.log('\nTest files summary:');
  console.log('  MERGE:    merge-doc1.pdf, merge-doc2.pdf, merge-doc3.pdf');
  console.log('  SPLIT:    split-multipage.pdf (10 pages), split-5pages.pdf (5 pages)');
  console.log('  COMPRESS: compress-large.pdf (20 pages), compress-medium.pdf (10 pages)');
  console.log('  CONVERT:  convert-single.pdf (1 page), convert-multi.pdf (4 pages)');
}

main().catch(console.error);
