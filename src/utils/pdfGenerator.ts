import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

export interface PDFExportOptions {
  fileName?: string;
  onProgress?: (progress: number, message: string) => void;
}

export async function exportToPdf(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const { fileName = 'Quotation.pdf', onProgress } = options;
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Element with id "${elementId}" not found for PDF export.`);
  }

  onProgress?.(10, 'Preparing document for PDF export...');

  // Store original styles
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;

  try {
    // Standard A4 width in pixels at 96 DPI is ~794px, at 2x is ~1588px
    element.style.width = '1020px';
    element.style.maxWidth = '1020px';

    onProgress?.(30, 'Rendering document canvas...');

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      windowWidth: 1200
    });

    onProgress?.(60, 'Generating PDF pages...');

    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 5; // 5mm margin

    const contentWidth = pageWidth - margin * 2;
    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;
    const pageContentHeight = pageHeight - margin * 2;

    const imgData = canvas.toDataURL('image/jpeg', 0.95);

    // First page
    pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
    heightLeft -= pageContentHeight;

    // Subsequent pages if document height exceeds single A4
    let pageNum = 1;
    while (heightLeft > 0) {
      position = margin - pageNum * pageContentHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
      heightLeft -= pageContentHeight;
      pageNum++;
    }

    onProgress?.(90, 'Finalizing download...');
    pdf.save(fileName);
    onProgress?.(100, 'PDF saved successfully!');
  } finally {
    // Restore original styles
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
  }
}
