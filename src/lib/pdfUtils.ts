import { PDFDocument } from 'pdf-lib';

/**
 * يأخذ ملف PDF ويعيد Blob يحتوي فقط على أول N صفحات
 */
export async function extractFirstNPagesFromPdf(file: File, n: number = 30): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  const newPdf = await PDFDocument.create();
  const totalPages = pdfDoc.getPageCount();
  const pageIndexes = Array.from({ length: Math.min(n, totalPages) }, (_, i) => i);
  const copiedPages = await newPdf.copyPages(pdfDoc, pageIndexes);
  copiedPages.forEach(page => newPdf.addPage(page));
  const pdfBytes = await newPdf.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
